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

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

async function checkRateLimit(supabase: ReturnType<typeof createClient>, clientId: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("direction", "outbound")
    .gte("timestamp", since);

  return (count ?? 0) < RATE_LIMIT_MAX;
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

    // ── GET /whatsapp-webhook/verify ────────────────────────────────────
    if (req.method === "GET" && action === "verify") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      const expectedToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") ?? "kohl-verify-token";
      if (mode === "subscribe" && token === expectedToken) {
        return new Response(challenge ?? "", { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // ── POST /whatsapp-webhook/incoming ─────────────────────────────────
    if (req.method === "POST" && action === "incoming") {
      const body = await req.json();

      await supabase.from("system_logs").insert({
        client_id: null,
        level: "INFO",
        event_type: "webhook_received",
        message: "Incoming WhatsApp webhook payload received",
        payload: body,
      });

      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;

      if (!value?.messages?.length) {
        return jsonResponse({ status: "no_messages" });
      }

      for (const msg of value.messages) {
        const externalMessageId = msg.id;
        const fromNumber = msg.from;
        const phoneNumberId = value.metadata?.phone_number_id;
        const messageBody = msg.text?.body ?? msg.type ?? "";

        // Resolve connection from phone_number_id
        const { data: connection } = await supabase
          .from("whatsapp_connections")
          .select("id, client_id")
          .eq("api_credentials->phoneNumberId", phoneNumberId)
          .maybeSingle();

        if (!connection) {
          await supabase.from("system_logs").insert({
            client_id: null,
            level: "WARN",
            event_type: "message_unrouted",
            message: `No connection found for phoneNumberId ${phoneNumberId}`,
            payload: { phoneNumberId, externalMessageId },
          });
          continue;
        }

        const { client_id, id: connection_id } = connection;

        // Idempotency: skip if already processed
        const { data: existing } = await supabase
          .from("messages")
          .select("id, processed")
          .eq("external_message_id", externalMessageId)
          .maybeSingle();

        if (existing?.processed) {
          await supabase.from("system_logs").insert({
            client_id,
            level: "INFO",
            event_type: "message_duplicate",
            message: `Duplicate message ${externalMessageId} skipped`,
            payload: { externalMessageId },
          });
          continue;
        }

        // Insert or get message record
        let messageDbId: string;
        if (existing) {
          messageDbId = existing.id;
        } else {
          const { data: inserted } = await supabase
            .from("messages")
            .insert({
              connection_id,
              client_id,
              external_message_id: externalMessageId,
              direction: "inbound",
              from_number: fromNumber,
              to_number: phoneNumberId,
              body: messageBody,
            })
            .select("id")
            .single();
          messageDbId = inserted?.id;
        }

        await supabase.from("system_logs").insert({
          client_id,
          level: "INFO",
          event_type: "message_received",
          message: `Inbound message from ${fromNumber}: ${messageBody.slice(0, 80)}`,
          payload: { externalMessageId, from: fromNumber, connection_id },
        });

        // Check kill switch
        const { data: botCtrl } = await supabase
          .from("bot_controls")
          .select("is_paused")
          .eq("connection_id", connection_id)
          .maybeSingle();

        if (botCtrl?.is_paused) {
          await supabase.from("system_logs").insert({
            client_id,
            level: "INFO",
            event_type: "bot_paused_skip",
            message: `Bot paused for connection ${connection_id}. Message not processed.`,
            payload: { externalMessageId },
          });
          await supabase
            .from("messages")
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq("id", messageDbId);
          continue;
        }

        // Rate limit check
        const withinLimit = await checkRateLimit(supabase, client_id);
        if (!withinLimit) {
          await supabase.from("system_logs").insert({
            client_id,
            level: "WARN",
            event_type: "rate_limit_hit",
            message: `Rate limit reached for client ${client_id}. Message skipped.`,
            payload: { externalMessageId, client_id },
          });
          continue;
        }

        // Fetch AI config
        const { data: aiConfig } = await supabase
          .from("ai_configs")
          .select("openai_api_key_encrypted, model, max_tokens, temperature, persona_instructions, confidence_threshold, is_active")
          .eq("connection_id", connection_id)
          .maybeSingle();

        if (!aiConfig?.is_active || !aiConfig?.openai_api_key_encrypted) {
          await supabase.from("system_logs").insert({
            client_id,
            level: "WARN",
            event_type: "ai_not_configured",
            message: `No active AI config for connection ${connection_id}`,
            payload: { connection_id },
          });
          await supabase
            .from("messages")
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq("id", messageDbId);
          continue;
        }

        // Decrypt key
        const encryptionSecret = Deno.env.get("OPENAI_KEY_ENCRYPTION_SECRET") ?? "default-encryption-secret-change-me";
        let apiKey: string;
        try {
          if (aiConfig.openai_api_key_encrypted.startsWith("ENCRYPTED:")) {
            apiKey = atob(aiConfig.openai_api_key_encrypted.replace("ENCRYPTED:", ""));
          } else {
            const { data: decrypted } = await supabase.rpc("pgp_sym_decrypt_text", {
              data: aiConfig.openai_api_key_encrypted,
              psw: encryptionSecret,
            });
            apiKey = decrypted;
          }
        } catch {
          await supabase.from("system_logs").insert({
            client_id,
            level: "ERROR",
            event_type: "key_decrypt_failed",
            message: `Failed to decrypt OpenAI key for connection ${connection_id}`,
            payload: { connection_id },
          });
          continue;
        }

        // Call OpenAI
        await supabase.from("system_logs").insert({
          client_id,
          level: "INFO",
          event_type: "openai_call",
          message: `Calling OpenAI for message from ${fromNumber}`,
          payload: { connection_id, model: aiConfig.model },
        });

        let aiReply = "";
        try {
          const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: aiConfig.model,
              messages: [
                { role: "system", content: aiConfig.persona_instructions || "Você é um assistente virtual útil e cordial." },
                { role: "user", content: messageBody },
              ],
              max_tokens: aiConfig.max_tokens,
              temperature: aiConfig.temperature,
            }),
            signal: AbortSignal.timeout(25000),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            aiReply = aiData.choices?.[0]?.message?.content ?? "";
          } else {
            await supabase.from("system_logs").insert({
              client_id,
              level: "ERROR",
              event_type: "openai_error",
              message: `OpenAI returned HTTP ${aiRes.status}`,
              payload: { connection_id, status: aiRes.status },
            });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await supabase.from("system_logs").insert({
            client_id,
            level: "ERROR",
            event_type: "openai_exception",
            message: `OpenAI call failed: ${msg}`,
            payload: { connection_id },
          });
        }

        // Mark original message as processed
        await supabase
          .from("messages")
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq("id", messageDbId);

        if (aiReply) {
          // Save outbound message
          await supabase.from("messages").insert({
            connection_id,
            client_id,
            direction: "outbound",
            from_number: phoneNumberId,
            to_number: fromNumber,
            body: aiReply,
            ai_response: true,
          });

          await supabase.from("system_logs").insert({
            client_id,
            level: "INFO",
            event_type: "message_sent",
            message: `AI reply sent to ${fromNumber}: ${aiReply.slice(0, 80)}`,
            payload: { connection_id, to: fromNumber },
          });

          // Send via WhatsApp Business API
          const { data: conn } = await supabase
            .from("whatsapp_connections")
            .select("api_credentials, connection_type")
            .eq("id", connection_id)
            .maybeSingle();

          if (conn?.connection_type === "api_oficial" && conn.api_credentials) {
            const creds = conn.api_credentials as Record<string, string>;
            const waRes = await fetch(
              `https://graph.facebook.com/v18.0/${creds.phoneNumberId}/messages`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${creds.accessToken}`,
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: fromNumber,
                  text: { body: aiReply },
                }),
              }
            );

            if (!waRes.ok) {
              await supabase.from("system_logs").insert({
                client_id,
                level: "ERROR",
                event_type: "whatsapp_send_failed",
                message: `Failed to send WhatsApp message: HTTP ${waRes.status}`,
                payload: { connection_id, to: fromNumber },
              });
            }
          }
        }
      }

      return jsonResponse({ status: "ok" });
    }

    // ── POST /whatsapp-webhook/update-status ────────────────────────────
    if (req.method === "POST" && action === "update-status") {
      const { connection_id, status, qr_code, client_id } = await req.json();

      if (!connection_id) {
        return jsonResponse({ error: "Missing connection_id" }, 400);
      }

      const updateData: Record<string, unknown> = { last_activity: new Date().toISOString() };
      if (status) updateData.status = status;
      if (qr_code !== undefined) updateData.qr_code = qr_code;

      const { error } = await supabase
        .from("whatsapp_connections")
        .update(updateData)
        .eq("id", connection_id);

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      const eventMap: Record<string, string> = {
        scanning: "qr_generated",
        connected: "session_connected",
        disconnected: "session_disconnected",
        error: "session_error",
      };

      await supabase.from("system_logs").insert({
        client_id: client_id ?? null,
        level: status === "error" ? "ERROR" : "INFO",
        event_type: eventMap[status] ?? "status_update",
        message: `Connection ${connection_id} status changed to: ${status}`,
        payload: { connection_id, status },
      });

      return jsonResponse({ success: true });
    }

    // ── POST /whatsapp-webhook/toggle-pause ─────────────────────────────
    if (req.method === "POST" && action === "toggle-pause") {
      const { connection_id, client_id, is_paused, reason } = await req.json();

      if (!connection_id || !client_id) {
        return jsonResponse({ error: "Missing connection_id or client_id" }, 400);
      }

      const upsertData = {
        connection_id,
        client_id,
        is_paused: !!is_paused,
        paused_at: is_paused ? new Date().toISOString() : null,
        pause_reason: reason ?? "",
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("bot_controls")
        .select("id")
        .eq("connection_id", connection_id)
        .maybeSingle();

      if (existing) {
        await supabase.from("bot_controls").update(upsertData).eq("connection_id", connection_id);
      } else {
        await supabase.from("bot_controls").insert(upsertData);
      }

      await supabase.from("system_logs").insert({
        client_id,
        level: "INFO",
        event_type: is_paused ? "bot_paused" : "bot_resumed",
        message: `Bot ${is_paused ? "paused" : "resumed"} for connection ${connection_id}`,
        payload: { connection_id, reason },
      });

      return jsonResponse({ success: true, is_paused: !!is_paused });
    }

    return jsonResponse({ error: "Unknown action" }, 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[whatsapp-webhook] Unhandled error:", msg);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
