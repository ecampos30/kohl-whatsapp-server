cat > supabase/functions/whatsapp-webhook/index.ts <<'EOF'
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();
    const remoteJid = body?.remoteJid || body?.from || "desconhecido";
    const userText = (body?.text || "").trim();

    if (!userText) {
      return new Response(JSON.stringify({ reply: "" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "SUA_OPENAI_API_KEY";

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: memoryRows, error: memoryError } = await supabase
      .from("whatsapp_memory")
      .select("role, content, created_at")
      .eq("remote_jid", remoteJid)
      .order("created_at", { ascending: false })
      .limit(10);

    if (memoryError) {
      console.error("memory read error", memoryError.message);
    }

    const history = (memoryRows || [])
      .slice()
      .reverse()
      .map((row) => ({
        role: row.role,
        content: row.content,
      }));

    const messages = [
      {
        role: "system",
        content:
          "Você é um assistente de WhatsApp útil, objetivo, natural e educado. Responda de forma curta, clara e conversacional. Use o contexto anterior quando fizer sentido.",
      },
      ...history,
      {
        role: "user",
        content: userText,
      },
    ];

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.7,
      }),
    });

    const aiData = await aiResponse.json();
    const reply =
      aiData?.choices?.[0]?.message?.content?.trim() ||
      "Desculpe, não consegui responder agora.";

    await supabase.from("whatsapp_memory").insert([
      {
        remote_jid: remoteJid,
        role: "user",
        content: userText,
      },
      {
        remote_jid: remoteJid,
        role: "assistant",
        content: reply,
      },
    ]);

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("webhook fatal error", err);
    return new Response(
      JSON.stringify({ reply: "Tive um erro agora. Tente novamente em instantes." }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
EOF