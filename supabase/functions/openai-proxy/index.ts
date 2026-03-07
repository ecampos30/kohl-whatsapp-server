import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // ── POST /openai-proxy/save-key ─────────────────────────────────────
    if (req.method === "POST" && action === "save-key") {
      const { connection_id, client_id, api_key, model, max_tokens, temperature, persona_instructions, escalation_triggers, confidence_threshold } = await req.json();

      if (!api_key || !connection_id || !client_id) {
        return jsonResponse({ error: "Missing required fields" }, 400);
      }

      const encryptionSecret = Deno.env.get("OPENAI_KEY_ENCRYPTION_SECRET") ?? "default-encryption-secret-change-me";
      const last4 = api_key.slice(-4);

      const { data: encrypted, error: encErr } = await supabase.rpc("pgp_sym_encrypt_text", {
        data: api_key,
        psw: encryptionSecret,
      });

      let encryptedKey = encrypted;
      if (encErr) {
        const { data: encResult } = await supabase
          .from("ai_configs")
          .select("id")
          .eq("connection_id", connection_id)
          .maybeSingle();
        encryptedKey = "ENCRYPTED:" + btoa(api_key);
        console.warn("[openai-proxy] pgp_sym_encrypt not available, using base64 fallback");
      }

      const upsertData = {
        connection_id,
        client_id,
        openai_api_key_encrypted: encryptedKey ?? ("ENCRYPTED:" + btoa(api_key)),
        openai_key_last4: last4,
        model: model ?? "gpt-3.5-turbo",
        max_tokens: max_tokens ?? 500,
        temperature: temperature ?? 0.7,
        persona_instructions: persona_instructions ?? "",
        escalation_triggers: escalation_triggers ?? [],
        confidence_threshold: confidence_threshold ?? 0.4,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("ai_configs")
        .select("id")
        .eq("connection_id", connection_id)
        .maybeSingle();

      let result;
      if (existing) {
        result = await supabase
          .from("ai_configs")
          .update(upsertData)
          .eq("connection_id", connection_id);
      } else {
        result = await supabase.from("ai_configs").insert(upsertData);
      }

      if (result.error) {
        return jsonResponse({ error: result.error.message }, 500);
      }

      await supabase.from("system_logs").insert({
        client_id,
        level: "INFO",
        event_type: "openai_key_saved",
        message: `OpenAI key updated for connection ${connection_id} (last4: ${last4})`,
        payload: { connection_id, last4 },
      });

      return jsonResponse({ success: true, last4 });
    }

    // ── POST /openai-proxy/test-key ─────────────────────────────────────
    if (req.method === "POST" && action === "test-key") {
      const { connection_id, client_id } = await req.json();

      if (!connection_id || !client_id) {
        return jsonResponse({ error: "Missing connection_id or client_id" }, 400);
      }

      const { data: config, error: cfgErr } = await supabase
        .from("ai_configs")
        .select("openai_api_key_encrypted, model")
        .eq("connection_id", connection_id)
        .maybeSingle();

      if (cfgErr || !config) {
        return jsonResponse({ status: "not_configured" }, 200);
      }

      const encryptionSecret = Deno.env.get("OPENAI_KEY_ENCRYPTION_SECRET") ?? "default-encryption-secret-change-me";
      let apiKey: string;

      try {
        if (config.openai_api_key_encrypted?.startsWith("ENCRYPTED:")) {
          apiKey = atob(config.openai_api_key_encrypted.replace("ENCRYPTED:", ""));
        } else {
          const { data: decrypted } = await supabase.rpc("pgp_sym_decrypt_text", {
            data: config.openai_api_key_encrypted,
            psw: encryptionSecret,
          });
          apiKey = decrypted;
        }
      } catch {
        return jsonResponse({ status: "error", message: "Falha ao descriptografar a chave" }, 200);
      }

      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          await supabase.from("system_logs").insert({
            client_id,
            level: "INFO",
            event_type: "openai_key_test",
            message: "OpenAI key test: OK",
            payload: { connection_id },
          });
          return jsonResponse({ status: "ok" });
        }

        if (response.status === 401) {
          return jsonResponse({ status: "invalid_key", message: "Chave inválida" });
        }
        if (response.status === 429) {
          return jsonResponse({ status: "quota_exceeded", message: "Cota esgotada ou limite de taxa" });
        }
        return jsonResponse({ status: "error", message: `HTTP ${response.status}` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase.from("system_logs").insert({
          client_id,
          level: "ERROR",
          event_type: "openai_key_test",
          message: `OpenAI key test failed: ${msg}`,
          payload: { connection_id },
        });
        return jsonResponse({ status: "error", message: "Erro ao conectar com a OpenAI" });
      }
    }

    // ── POST /openai-proxy/chat ─────────────────────────────────────────
    if (req.method === "POST" && action === "chat") {
      const { connection_id, client_id, user_message, system_prompt } = await req.json();

      if (!connection_id || !client_id || !user_message) {
        return jsonResponse({ error: "Missing required fields" }, 400);
      }

      const { data: config } = await supabase
        .from("ai_configs")
        .select("openai_api_key_encrypted, model, max_tokens, temperature, confidence_threshold")
        .eq("connection_id", connection_id)
        .maybeSingle();

      if (!config) {
        return jsonResponse({ error: "AI not configured for this connection" }, 400);
      }

      const encryptionSecret = Deno.env.get("OPENAI_KEY_ENCRYPTION_SECRET") ?? "default-encryption-secret-change-me";
      let apiKey: string;

      try {
        if (config.openai_api_key_encrypted?.startsWith("ENCRYPTED:")) {
          apiKey = atob(config.openai_api_key_encrypted.replace("ENCRYPTED:", ""));
        } else {
          const { data: decrypted } = await supabase.rpc("pgp_sym_decrypt_text", {
            data: config.openai_api_key_encrypted,
            psw: encryptionSecret,
          });
          apiKey = decrypted;
        }
      } catch {
        return jsonResponse({ error: "Failed to decrypt API key" }, 500);
      }

      const messages = [
        { role: "system", content: system_prompt ?? "Você é um assistente virtual útil." },
        { role: "user", content: user_message },
      ];

      await supabase.from("system_logs").insert({
        client_id,
        level: "INFO",
        event_type: "openai_call",
        message: `Calling OpenAI model ${config.model} for connection ${connection_id}`,
        payload: { connection_id, model: config.model, message_length: user_message.length },
      });

      try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages,
            max_tokens: config.max_tokens,
            temperature: config.temperature,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          await supabase.from("system_logs").insert({
            client_id,
            level: "ERROR",
            event_type: "openai_call",
            message: `OpenAI API error: HTTP ${aiResponse.status}`,
            payload: { connection_id, status: aiResponse.status },
          });
          return jsonResponse({ error: `OpenAI error: ${aiResponse.status}` }, 500);
        }

        const aiData = await aiResponse.json();
        const reply = aiData.choices?.[0]?.message?.content ?? "";

        await supabase.from("system_logs").insert({
          client_id,
          level: "INFO",
          event_type: "openai_response",
          message: `OpenAI responded for connection ${connection_id}`,
          payload: { connection_id, reply_length: reply.length },
        });

        return jsonResponse({ reply, model: config.model });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase.from("system_logs").insert({
          client_id,
          level: "ERROR",
          event_type: "openai_call",
          message: `OpenAI call exception: ${msg}`,
          payload: { connection_id },
        });
        return jsonResponse({ error: "OpenAI call failed" }, 500);
      }
    }

    return jsonResponse({ error: "Unknown action" }, 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[openai-proxy] Unhandled error:", msg);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
