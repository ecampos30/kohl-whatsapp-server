import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HANDOFF_DURATION_MS = 60 * 60 * 1000;

const MONITORING_KEYWORDS = [
  "comprovante",
  "paguei",
  "pagamento",
  "matrícula",
  "matricula",
  "aluna",
  "inscrita",
  "transferência",
  "transferencia",
  "pix",
];

const DEFAULT_MODEL = "gpt-3.5-turbo";
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_PERSONA =
  "Você é um assistente útil no WhatsApp. Responda de forma natural, curta e clara. Use o contexto anterior quando fizer sentido.";

interface HandoffEntry {
  paused: boolean;
  paused_at: string;
  expires_at: string;
  origin: "panel" | "whatsapp";
}

type HandoffMap = Record<string, HandoffEntry>;

function parseHandoffMap(raw: string | null): HandoffMap {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as HandoffMap;
  } catch {
    return {};
  }
}

function isContactPausedInMap(map: HandoffMap, remoteJid: string): boolean {
  const entry = map[remoteJid];
  if (!entry || !entry.paused) return false;
  return new Date(entry.expires_at) > new Date();
}

function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return MONITORING_KEYWORDS.filter((kw) => lower.includes(kw));
}

async function decryptApiKey(
  supabase: ReturnType<typeof createClient>,
  encryptedKey: string
): Promise<string | null> {
  try {
    if (encryptedKey.startsWith("ENCRYPTED:")) {
      return atob(encryptedKey.replace("ENCRYPTED:", ""));
    }
    const secret =
      Deno.env.get("OPENAI_KEY_ENCRYPTION_SECRET") ??
      "default-encryption-secret-change-me";
    const { data, error } = await supabase.rpc("pgp_sym_decrypt_text", {
      data: encryptedKey,
      psw: secret,
    });
    if (error) return null;
    return data as string;
  } catch {
    return null;
  }
}

serve(async (req) => {
  try {
    const body = await req.json();

    console.log("Mensagem recebida:", body);

    const remoteJid = body?.remoteJid || body?.from || "unknown";
    const text = (body?.text || "").trim();
    const incomingConnectionId: string | null = body?.connectionId ?? null;

    if (!text) {
      return new Response(JSON.stringify({ reply: "" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const connectionQuery = supabase
      .from("whatsapp_connections")
      .select("id, client_id");

    if (incomingConnectionId) {
      connectionQuery.eq("id", incomingConnectionId);
    } else {
      connectionQuery.limit(1);
    }

    const { data: connection } = await connectionQuery.maybeSingle();

    const connectionId = connection?.id ?? null;
    const clientId = connection?.client_id ?? null;

    if (connectionId && clientId) {
      const normalized = text.toLowerCase().trim();

      if (normalized === "#sair") {
        const { data: existing } = await supabase
          .from("bot_controls")
          .select("pause_reason")
          .eq("connection_id", connectionId)
          .maybeSingle();

        const map = parseHandoffMap(existing?.pause_reason ?? null);
        const now = new Date();
        map[remoteJid] = {
          paused: true,
          paused_at: now.toISOString(),
          expires_at: new Date(now.getTime() + HANDOFF_DURATION_MS).toISOString(),
          origin: "whatsapp",
        };

        await supabase.from("bot_controls").upsert(
          {
            connection_id: connectionId,
            client_id: clientId,
            pause_reason: JSON.stringify(map),
            updated_at: now.toISOString(),
          },
          { onConflict: "connection_id" }
        );

        console.log(`Handoff ativado para ${remoteJid} por 1h`);
        return new Response(JSON.stringify({ reply: "" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (normalized === "#bot") {
        const { data: existing } = await supabase
          .from("bot_controls")
          .select("pause_reason")
          .eq("connection_id", connectionId)
          .maybeSingle();

        const map = parseHandoffMap(existing?.pause_reason ?? null);
        delete map[remoteJid];

        await supabase.from("bot_controls").upsert(
          {
            connection_id: connectionId,
            client_id: clientId,
            pause_reason: JSON.stringify(map),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "connection_id" }
        );

        console.log(`Bot reativado para ${remoteJid}`);
        return new Response(JSON.stringify({ reply: "" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { data: ctrl } = await supabase
        .from("bot_controls")
        .select("pause_reason")
        .eq("connection_id", connectionId)
        .maybeSingle();

      const map = parseHandoffMap(ctrl?.pause_reason ?? null);

      if (isContactPausedInMap(map, remoteJid)) {
        const detectedKeywords = detectKeywords(text);

        await supabase.from("messages").insert({
          connection_id: connectionId,
          client_id: clientId,
          direction: "inbound",
          from_number: remoteJid,
          to_number: "",
          body: text,
          ai_response: false,
          processed: false,
          timestamp: new Date().toISOString(),
          payload: {
            handoff_active: true,
            keywords_detected: detectedKeywords,
          },
        });

        console.log(`Modo humano ativo para ${remoteJid} — mensagem registrada`);
        return new Response(JSON.stringify({ reply: "" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      const entry = map[remoteJid];
      if (entry && new Date(entry.expires_at) <= new Date()) {
        delete map[remoteJid];
        await supabase.from("bot_controls").upsert(
          {
            connection_id: connectionId,
            client_id: clientId,
            pause_reason: JSON.stringify(map),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "connection_id" }
        );
        console.log(`Handoff expirado para ${remoteJid} — bot retomado`);
      }
    }

    // ── Load AI configuration from ai_configs table ──────────────────────
    let aiModel = DEFAULT_MODEL;
    let aiMaxTokens = DEFAULT_MAX_TOKENS;
    let aiTemperature = DEFAULT_TEMPERATURE;
    let aiPersona = DEFAULT_PERSONA;
    let openaiApiKey = Deno.env.get("OPENAI_API_KEY") ?? null;

    if (connectionId) {
      const { data: aiConfig } = await supabase
        .from("ai_configs")
        .select(
          "openai_api_key_encrypted, model, max_tokens, temperature, persona_instructions, is_active"
        )
        .eq("connection_id", connectionId)
        .maybeSingle();

      if (aiConfig && aiConfig.is_active !== false) {
        if (aiConfig.model) aiModel = aiConfig.model;
        if (aiConfig.max_tokens) aiMaxTokens = aiConfig.max_tokens;
        if (typeof aiConfig.temperature === "number")
          aiTemperature = aiConfig.temperature;
        if (aiConfig.persona_instructions?.trim())
          aiPersona = aiConfig.persona_instructions.trim();

        if (aiConfig.openai_api_key_encrypted) {
          const decrypted = await decryptApiKey(
            supabase,
            aiConfig.openai_api_key_encrypted
          );
          if (decrypted) openaiApiKey = decrypted;
        }
      }
    }

    if (!openaiApiKey) {
      console.error("No OpenAI API key available");
      return new Response(
        JSON.stringify({
          reply: "Serviço temporariamente indisponível. Tente novamente em instantes.",
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── Load conversation history from whatsapp_memory ────────────────────
    const { data: history, error: historyError } = await supabase
      .from("whatsapp_memory")
      .select("role, content")
      .eq("remote_jid", remoteJid)
      .order("created_at", { ascending: false })
      .limit(10);

    if (historyError) {
      console.error("history error", historyError.message);
    }

    const messages = [
      { role: "system", content: aiPersona },
      ...((history || []).slice().reverse()),
      { role: "user", content: text },
    ];

    // ── Call OpenAI ───────────────────────────────────────────────────────
    console.log(`Calling OpenAI model=${aiModel} tokens=${aiMaxTokens} temp=${aiTemperature}`);

    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages,
        max_tokens: aiMaxTokens,
        temperature: aiTemperature,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!ai.ok) {
      const errText = await ai.text();
      console.error(`OpenAI error ${ai.status}: ${errText}`);

      if (connectionId && clientId) {
        await supabase.from("system_logs").insert({
          client_id: clientId,
          level: "ERROR",
          event_type: "openai_call",
          message: `OpenAI error for ${remoteJid}: HTTP ${ai.status}`,
          payload: { connection_id: connectionId, status: ai.status },
        });
      }

      return new Response(
        JSON.stringify({ reply: "Desculpe, tive um erro agora. Tente novamente." }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    const aiData = await ai.json();
    const reply =
      aiData?.choices?.[0]?.message?.content?.trim() ||
      "Desculpe, tive um erro agora.";

    // ── Persist conversation to whatsapp_memory ───────────────────────────
    const { error: insertError } = await supabase
      .from("whatsapp_memory")
      .insert([
        {
          remote_jid: remoteJid,
          connection_id: connectionId ?? undefined,
          role: "user",
          content: text,
        },
        {
          remote_jid: remoteJid,
          connection_id: connectionId ?? undefined,
          role: "assistant",
          content: reply,
        },
      ]);

    if (insertError) {
      console.error("memory insert error", insertError.message);
    }

    if (connectionId && clientId) {
      await supabase.from("system_logs").insert({
        client_id: clientId,
        level: "INFO",
        event_type: "openai_response",
        message: `AI responded to ${remoteJid} via model ${aiModel}`,
        payload: {
          connection_id: connectionId,
          model: aiModel,
          reply_length: reply.length,
        },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("fatal error", err);

    return new Response(
      JSON.stringify({
        reply: "Tive um erro agora. Tente novamente em instantes.",
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }
});
