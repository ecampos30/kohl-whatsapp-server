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

serve(async (req) => {
  try {
    const body = await req.json();

    console.log("Mensagem recebida:", body);

    const remoteJid = body?.remoteJid || body?.from || "unknown";
    const text = (body?.text || "").trim();

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

    const { data: connection } = await supabase
      .from("whatsapp_connections")
      .select("id, client_id")
      .limit(1)
      .maybeSingle();

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
      {
        role: "system",
        content:
          "Você é um assistente útil no WhatsApp. Responda de forma natural, curta e clara. Use o contexto anterior quando fizer sentido.",
      },
      ...((history || []).slice().reverse()),
      {
        role: "user",
        content: text,
      },
    ];

    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.7,
      }),
    });

    const aiData = await ai.json();

    const reply =
      aiData?.choices?.[0]?.message?.content?.trim() ||
      "Desculpe, tive um erro agora.";

    const { error: insertError } = await supabase
      .from("whatsapp_memory")
      .insert([
        { remote_jid: remoteJid, role: "user", content: text },
        { remote_jid: remoteJid, role: "assistant", content: reply },
      ]);

    if (insertError) {
      console.error("insert error", insertError.message);
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("fatal error", err);

    return new Response(
      JSON.stringify({ reply: "Tive um erro agora. Tente novamente em instantes." }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
