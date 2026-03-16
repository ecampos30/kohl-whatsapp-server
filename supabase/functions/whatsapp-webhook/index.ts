import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  "Você é a assistente virtual da Kohl, escola especializada em cursos de micropigmentação e estética. Seu objetivo é informar sobre os cursos disponíveis (Microblading, Nanoblading, NanoLips, BB Glow, Camuflagem de Cicatrizes, Harmonização de Aréola, Nanoliner e outros), preços, datas, inscrições e formas de pagamento. Responda de forma cordial, direta e profissional. Quando o cliente demonstrar interesse em se inscrever ou pagar, incentive e oriente sobre os próximos passos. Se não souber a resposta exata, oriente o cliente a digitar #sair para falar com um atendente humano. Responda sempre em português.";

// ── OpenClaw integration config ───────────────────────────────────────────────
const OPENCLAW_REPLY_URL = "http://56.125.222.193:18789/webhook/reply";
const OPENCLAW_TOKEN = "b628d0ba17085bcc4372098a0fc7d4e53bfc02e76634177c";

/**
 * Detects if the incoming request body originated from OpenClaw.
 *
 * OpenClaw payload format (assumed — adjust field names if different):
 * {
 *   source: "openclaw",          // identifier field (optional, used as hint)
 *   phone: "5511999999999",      // sender phone number
 *   message: "texto da mensagem", // message text
 *   session_id: "abc123",        // OpenClaw session/conversation ID (optional)
 *   // alternative field names that OpenClaw might use:
 *   // from: "5511999999999"
 *   // text: "texto da mensagem"
 *   // body: "texto da mensagem"
 *   // number: "5511999999999"
 * }
 *
 * IMPORTANT: Adjust the field mapping below (`openclawPhone`, `openclawText`)
 * once the exact OpenClaw payload format is confirmed.
 */
function parseOpenClawPayload(body: Record<string, unknown>): {
  isOpenClaw: boolean;
  remoteJid: string;
  text: string;
  sessionId: string | null;
} | null {
  const isOpenClaw =
    body?.source === "openclaw" ||
    // fallback: if body has `phone` OR `number` field (typical in OpenClaw payloads)
    typeof body?.phone !== "undefined" ||
    typeof body?.number !== "undefined";

  if (!isOpenClaw) return null;

  // Map OpenClaw fields to internal format
  // TODO: confirm exact field names with OpenClaw documentation
  const rawPhone =
    (body?.phone as string) ||
    (body?.number as string) ||
    (body?.from as string) ||
    "";

  const rawText =
    (body?.message as string) ||
    (body?.text as string) ||
    (body?.body as string) ||
    "";

  const sessionId =
    (body?.session_id as string) ||
    (body?.sessionId as string) ||
    null;

  const remoteJid = rawPhone.replace(/\D/g, "") + "@s.whatsapp.net";

  return {
    isOpenClaw: true,
    remoteJid,
    text: rawText.trim(),
    sessionId,
  };
}

async function sendOpenClawReply(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
  remoteJid: string,
  reply: string,
  sessionId: string | null
): Promise<void> {
  try {
    // TODO: confirm exact reply payload format expected by OpenClaw
    const payload: Record<string, unknown> = {
      phone: remoteJid.replace("@s.whatsapp.net", ""),
      message: reply,
    };

    if (sessionId) {
      payload.session_id = sessionId;
    }

    const res = await fetch(OPENCLAW_REPLY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`OpenClaw reply error ${res.status}: ${errText}`);

      await supabase.from("system_logs").insert({
        client_id: clientId,
        level: "ERROR",
        event_type: "openclaw_reply_error",
        message: `Failed to send reply to OpenClaw for ${remoteJid}: HTTP ${res.status}`,
        payload: { remote_jid: remoteJid, status: res.status, error: errText },
      });
      return;
    }

    console.log(`OpenClaw reply sent successfully to ${remoteJid}`);

    await supabase.from("system_logs").insert({
      client_id: clientId,
      level: "INFO",
      event_type: "openclaw_reply_sent",
      message: `Reply sent to OpenClaw for ${remoteJid}`,
      payload: { remote_jid: remoteJid, reply_length: reply.length },
    });
  } catch (err) {
    console.error("OpenClaw reply fetch failed:", err);

    await supabase.from("system_logs").insert({
      client_id: clientId,
      level: "ERROR",
      event_type: "openclaw_reply_error",
      message: `Exception sending reply to OpenClaw for ${remoteJid}`,
      payload: { remote_jid: remoteJid, error: String(err) },
    });
  }
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

    // ── Detect and normalize OpenClaw payload ────────────────────────────
    const openClawData = parseOpenClawPayload(body as Record<string, unknown>);
    const isOpenClaw = openClawData !== null;

    const remoteJid = isOpenClaw
      ? openClawData!.remoteJid
      : (body?.remote_jid || body?.remoteJid || body?.from || "unknown");

    const text = isOpenClaw
      ? openClawData!.text
      : (body?.text || "").trim();

    const openClawSessionId = isOpenClaw ? openClawData!.sessionId : null;

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

    const DEFAULT_CONNECTION_ID = "00000000-0000-0000-0000-000000000002";
    const DEFAULT_CLIENT_ID = "00000000-0000-0000-0000-000000000001";

    const connectionQuery = supabase
      .from("whatsapp_connections")
      .select("id, client_id");

    if (incomingConnectionId) {
      connectionQuery.eq("id", incomingConnectionId);
    } else {
      connectionQuery.limit(1);
    }

    const { data: connection } = await connectionQuery.maybeSingle();

    const connectionId: string = connection?.id ?? DEFAULT_CONNECTION_ID;
    const clientId: string = connection?.client_id ?? DEFAULT_CLIENT_ID;

    const normalized = text.toLowerCase().trim();

    // ── Handoff command: activate human mode ─────────────────────────────
    if (normalized === "#sair" || normalized === "#humano") {
      await supabase.from("kohl_bot_control").upsert(
        {
          remote_jid: remoteJid,
          handoff_mode: true,
          handoff_by: "whatsapp",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "remote_jid" }
      );

      console.log(`Handoff ativado para ${remoteJid}`);
      return new Response(JSON.stringify({ reply: "" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── Bot command: deactivate human mode ────────────────────────────────
    if (normalized === "#bot") {
      await supabase.from("kohl_bot_control").upsert(
        {
          remote_jid: remoteJid,
          handoff_mode: false,
          handoff_by: "whatsapp",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "remote_jid" }
      );

      console.log(`Bot reativado para ${remoteJid}`);
      return new Response(JSON.stringify({ reply: "" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── Check if contact is in handoff mode ───────────────────────────────
    const { data: ctrl } = await supabase
      .from("kohl_bot_control")
      .select("handoff_mode")
      .eq("remote_jid", remoteJid)
      .maybeSingle();

    if (ctrl?.handoff_mode === true) {
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
          source: isOpenClaw ? "openclaw" : "baileys",
        },
      });

      console.log(`Modo humano ativo para ${remoteJid} — mensagem registrada`);
      return new Response(JSON.stringify({ reply: "" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
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

      await supabase.from("system_logs").insert({
        client_id: clientId,
        level: "ERROR",
        event_type: "openai_call",
        message: `OpenAI error for ${remoteJid}: HTTP ${ai.status}`,
        payload: { connection_id: connectionId, status: ai.status },
      });

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

    await supabase.from("system_logs").insert({
      client_id: clientId,
      level: "INFO",
      event_type: "openai_response",
      message: `AI responded to ${remoteJid} via model ${aiModel}`,
      payload: {
        connection_id: connectionId,
        model: aiModel,
        reply_length: reply.length,
        source: isOpenClaw ? "openclaw" : "baileys",
      },
    });

    // ── Send reply back to OpenClaw (fire-and-forget, does not block response) ──
    if (isOpenClaw) {
      EdgeRuntime.waitUntil(
        sendOpenClawReply(supabase, clientId, remoteJid, reply, openClawSessionId)
      );
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
