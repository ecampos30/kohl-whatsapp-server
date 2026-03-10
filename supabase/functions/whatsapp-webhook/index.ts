import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {

  const body = await req.json()

  const remoteJid = body?.remoteJid || body?.from || "unknown"
  const text = body?.text || ""

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // buscar histórico
  const { data: history } = await supabase
    .from("whatsapp_memory")
    .select("role,content")
    .eq("remote_jid", remoteJid)
    .order("created_at", { ascending: false })
    .limit(10)

  const messages = [
    {
      role: "system",
      content: "Você é um assistente útil que responde mensagens de WhatsApp de forma natural."
    },
    ...(history || []).reverse(),
    {
      role: "user",
      content: text
    }
  ]

  const ai = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages
    })
  })

  const aiData = await ai.json()

  const reply =
    aiData?.choices?.[0]?.message?.content ||
    "Desculpe, tive um erro agora."

  // salvar memória
  await supabase.from("whatsapp_memory").insert([
    {
      remote_jid: remoteJid,
      role: "user",
      content: text
    },
    {
      remote_jid: remoteJid,
      role: "assistant",
      content: reply
    }
  ])

  return new Response(
    JSON.stringify({ reply }),
    { headers: { "Content-Type": "application/json" } }
  )

})