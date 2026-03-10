import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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