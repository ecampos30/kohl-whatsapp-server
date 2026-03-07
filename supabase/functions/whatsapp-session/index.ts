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

function getBaileysUrl(): string {
  return (Deno.env.get("BAILEYS_SERVER_URL") ?? "").replace(/\/$/, "");
}

function getBaileysSecret(): string {
  return Deno.env.get("BAILEYS_API_SECRET") ?? "";
}

function baileysHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getBaileysSecret()}`,
  };
}

async function baileysPost(path: string, body: Record<string, unknown>) {
  const url = `${getBaileysUrl()}${path}`;
  return fetch(url, {
    method: "POST",
    headers: baileysHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
}

async function baileysGet(path: string) {
  const url = `${getBaileysUrl()}${path}`;
  return fetch(url, {
    method: "GET",
    headers: baileysHeaders(),
    signal: AbortSignal.timeout(10000),
  });
}

async function baileysDelete(path: string) {
  const url = `${getBaileysUrl()}${path}`;
  return fetch(url, {
    method: "DELETE",
    headers: baileysHeaders(),
    signal: AbortSignal.timeout(10000),
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

    // ── POST /whatsapp-session/healthcheck ─────────────────────────────────
    if (req.method === "POST" && action === "healthcheck") {
      const { connection_id, client_id } = await req.json();

      if (!connection_id) {
        return jsonResponse({ error: "Missing connection_id" }, 400);
      }

      const { data: conn, error: connErr } = await supabase
        .from("whatsapp_connections")
        .select("id, client_id, connection_type, status, api_credentials, phone_number, display_name")
        .eq("id", connection_id)
        .maybeSingle();

      if (connErr || !conn) {
        return jsonResponse({ ok: false, error: "Conexão não encontrada", code: "NOT_FOUND" }, 404);
      }

      const effectiveClientId = client_id ?? conn.client_id;

      if (conn.connection_type !== "api_oficial") {
        await supabase.from("system_logs").insert({
          client_id: effectiveClientId,
          level: "WARN",
          event_type: "healthcheck_web_unsupported",
          message: `Healthcheck solicitado para conexão web (QR) ${connection_id} — use web-status`,
          payload: { connection_id },
        });

        return jsonResponse({
          ok: false,
          code: "USE_WEB_STATUS",
          error: "Para conexões web, use o endpoint web-status.",
          connection_type: "web",
        });
      }

      const creds = conn.api_credentials as Record<string, string> | null;
      if (!creds?.accessToken || !creds?.phoneNumberId) {
        await supabase.from("system_logs").insert({
          client_id: effectiveClientId,
          level: "WARN",
          event_type: "healthcheck_no_credentials",
          message: `Healthcheck falhou — credenciais ausentes para conexão ${connection_id}`,
          payload: { connection_id },
        });

        await supabase
          .from("whatsapp_connections")
          .update({ status: "error", last_activity: new Date().toISOString() })
          .eq("id", connection_id);

        return jsonResponse({
          ok: false,
          code: "MISSING_CREDENTIALS",
          error: "Access Token e Phone Number ID são obrigatórios. Configure em 'Business API'.",
        });
      }

      let metaStatus = 0;
      let metaBody: Record<string, unknown> = {};

      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v18.0/${creds.phoneNumberId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${creds.accessToken}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(10000),
          }
        );

        metaStatus = metaRes.status;
        metaBody = await metaRes.json().catch(() => ({}));
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        await supabase.from("system_logs").insert({
          client_id: effectiveClientId,
          level: "ERROR",
          event_type: "healthcheck_network_error",
          message: `Healthcheck — erro de rede ao contatar Meta: ${msg}`,
          payload: { connection_id },
        });

        return jsonResponse({
          ok: false,
          code: "NETWORK_ERROR",
          error: `Erro de rede ao verificar API da Meta: ${msg}`,
        });
      }

      const isOk = metaStatus >= 200 && metaStatus < 300;
      const newStatus = isOk ? "connected" : "error";

      await supabase
        .from("whatsapp_connections")
        .update({ status: newStatus, last_activity: new Date().toISOString() })
        .eq("id", connection_id);

      await supabase.from("system_logs").insert({
        client_id: effectiveClientId,
        level: isOk ? "INFO" : "ERROR",
        event_type: isOk ? "healthcheck_passed" : "healthcheck_failed",
        message: isOk
          ? `Healthcheck OK — conexão ${connection_id} verificada com Meta API (HTTP ${metaStatus})`
          : `Healthcheck FALHOU — conexão ${connection_id} recebeu HTTP ${metaStatus} da Meta API`,
        payload: { connection_id, http_status: metaStatus, meta_response: metaBody },
      });

      if (isOk) {
        return jsonResponse({
          ok: true,
          status: "connected",
          http_status: metaStatus,
          phone_number_id: creds.phoneNumberId,
          display_name: conn.display_name || conn.phone_number,
          message: "API da Meta respondeu com sucesso. Conexão real confirmada.",
        });
      }

      const metaError = (metaBody as { error?: { message?: string; code?: number } })?.error;
      return jsonResponse({
        ok: false,
        status: "error",
        code: "META_API_ERROR",
        http_status: metaStatus,
        error: metaError?.message ?? `HTTP ${metaStatus} da Meta API`,
        meta_error_code: metaError?.code,
      });
    }

    // ── POST /whatsapp-session/test-send ──────────────────────────────────
    if (req.method === "POST" && action === "test-send") {
      const { connection_id, client_id, test_phone } = await req.json();

      if (!connection_id) {
        return jsonResponse({ error: "Missing connection_id" }, 400);
      }

      const { data: conn, error: connErr } = await supabase
        .from("whatsapp_connections")
        .select("id, client_id, connection_type, status, api_credentials, phone_number")
        .eq("id", connection_id)
        .maybeSingle();

      if (connErr || !conn) {
        return jsonResponse({ ok: false, error: "Conexão não encontrada" }, 404);
      }

      const effectiveClientId = client_id ?? conn.client_id;

      if (conn.connection_type !== "api_oficial") {
        return jsonResponse({
          ok: false,
          code: "USE_WEB_SEND",
          error: "Para conexões web, use o endpoint web-send.",
        });
      }

      const creds = conn.api_credentials as Record<string, string> | null;
      if (!creds?.accessToken || !creds?.phoneNumberId) {
        return jsonResponse({
          ok: false,
          code: "MISSING_CREDENTIALS",
          error: "Credenciais incompletas. Configure o Access Token e Phone Number ID.",
        });
      }

      const targetPhone = test_phone ?? conn.phone_number;
      if (!targetPhone) {
        return jsonResponse({
          ok: false,
          code: "NO_TARGET_PHONE",
          error: "Informe um número de destino (test_phone) ou configure o phone_number na conexão.",
        });
      }

      const testBody = `[TESTE KOHL SYSTEM] Mensagem de teste enviada em ${new Date().toLocaleString("pt-BR")}. Se você recebeu esta mensagem, a conexão está funcionando corretamente.`;

      let sendStatus = 0;
      let sendBody: Record<string, unknown> = {};

      try {
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
              to: targetPhone,
              text: { body: testBody },
            }),
            signal: AbortSignal.timeout(15000),
          }
        );

        sendStatus = waRes.status;
        sendBody = await waRes.json().catch(() => ({}));
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        await supabase.from("system_logs").insert({
          client_id: effectiveClientId,
          level: "ERROR",
          event_type: "test_send_network_error",
          message: `Erro de rede no envio de teste para ${targetPhone}: ${msg}`,
          payload: { connection_id, target_phone: targetPhone },
        });

        return jsonResponse({ ok: false, code: "NETWORK_ERROR", error: msg });
      }

      const isOk = sendStatus >= 200 && sendStatus < 300;

      await supabase.from("system_logs").insert({
        client_id: effectiveClientId,
        level: isOk ? "INFO" : "ERROR",
        event_type: isOk ? "test_send_success" : "test_send_failed",
        message: isOk
          ? `[test_send] Mensagem de teste enviada com sucesso para ${targetPhone} via conexão ${connection_id}`
          : `[test_send] FALHOU ao enviar para ${targetPhone} — HTTP ${sendStatus}`,
        payload: { connection_id, target_phone: targetPhone, http_status: sendStatus, response: sendBody },
      });

      if (isOk) {
        const waMessageId = (sendBody as { messages?: Array<{ id: string }> })?.messages?.[0]?.id;

        await supabase.from("messages").insert({
          connection_id,
          client_id: effectiveClientId,
          direction: "outbound",
          from_number: creds.phoneNumberId,
          to_number: targetPhone,
          body: testBody,
          ai_response: false,
          processed: true,
          processed_at: new Date().toISOString(),
          external_message_id: waMessageId ?? `test-${Date.now()}`,
        });

        return jsonResponse({
          ok: true,
          message: `Mensagem de teste enviada com sucesso para ${targetPhone}.`,
          whatsapp_message_id: waMessageId,
          http_status: sendStatus,
        });
      }

      const sendErr = (sendBody as { error?: { message?: string; code?: number } })?.error;
      return jsonResponse({
        ok: false,
        code: "WHATSAPP_SEND_ERROR",
        http_status: sendStatus,
        error: sendErr?.message ?? `HTTP ${sendStatus} da API WhatsApp`,
        meta_error_code: sendErr?.code,
      });
    }

    // ── POST /whatsapp-session/reset ───────────────────────────────────────
    if (req.method === "POST" && action === "reset") {
      const { connection_id, client_id } = await req.json();

      if (!connection_id) {
        return jsonResponse({ error: "Missing connection_id" }, 400);
      }

      const { data: conn } = await supabase
        .from("whatsapp_connections")
        .select("client_id")
        .eq("id", connection_id)
        .maybeSingle();

      const effectiveClientId = client_id ?? conn?.client_id ?? null;

      await supabase
        .from("whatsapp_connections")
        .update({
          status: "disconnected",
          qr_code: null,
          last_activity: new Date().toISOString(),
        })
        .eq("id", connection_id);

      await supabase.from("system_logs").insert({
        client_id: effectiveClientId,
        level: "INFO",
        event_type: "session_reset",
        message: `Sessão reiniciada manualmente para conexão ${connection_id}`,
        payload: { connection_id },
      });

      return jsonResponse({ ok: true, status: "disconnected" });
    }

    // ── POST /whatsapp-session/web-start ──────────────────────────────────
    // Inicia uma sessão Baileys no servidor EC2.
    if (req.method === "POST" && action === "web-start") {
      const { connection_id, client_id } = await req.json();

      if (!connection_id) {
        return jsonResponse({ error: "Missing connection_id" }, 400);
      }

      const { data: conn } = await supabase
        .from("whatsapp_connections")
        .select("client_id, connection_type")
        .eq("id", connection_id)
        .maybeSingle();

      const effectiveClientId = client_id ?? conn?.client_id ?? null;

      if (!getBaileysUrl()) {
        return jsonResponse({ ok: false, code: "NOT_CONFIGURED", error: "BAILEYS_SERVER_URL não configurado." });
      }

      try {
        const res = await baileysPost("/session/start", { connectionId: connection_id });
        const body = await res.json().catch(() => ({}));

        await supabase
          .from("whatsapp_connections")
          .update({ status: "scanning", last_activity: new Date().toISOString() })
          .eq("id", connection_id);

        await supabase.from("system_logs").insert({
          client_id: effectiveClientId,
          level: "INFO",
          event_type: "web_session_started",
          message: `Sessão web iniciada para conexão ${connection_id}`,
          payload: { connection_id, baileys_response: body },
        });

        return jsonResponse({ ok: true, status: "scanning", ...body });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse({ ok: false, code: "BAILEYS_ERROR", error: msg });
      }
    }

    // ── GET /whatsapp-session/web-status ──────────────────────────────────
    // Consulta o status de uma sessão no servidor EC2 e sincroniza com Supabase.
    if (req.method === "GET" && action === "web-status") {
      const connectionId = url.searchParams.get("connection_id");

      if (!connectionId) {
        return jsonResponse({ error: "Missing connection_id" }, 400);
      }

      if (!getBaileysUrl()) {
        return jsonResponse({ ok: false, code: "NOT_CONFIGURED", error: "BAILEYS_SERVER_URL não configurado." });
      }

      try {
        const res = await baileysGet(`/session/${connectionId}/status`);
        const body = await res.json().catch(() => ({})) as Record<string, unknown>;

        const baileysStatus = (body.status as string) ?? "disconnected";
        const mappedStatus =
          baileysStatus === "open" || baileysStatus === "connected" ? "connected"
          : baileysStatus === "scanning" ? "scanning"
          : "disconnected";

        await supabase
          .from("whatsapp_connections")
          .update({ status: mappedStatus, last_activity: new Date().toISOString() })
          .eq("id", connectionId);

        return jsonResponse({ ok: true, status: mappedStatus, raw: body });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse({ ok: false, code: "BAILEYS_ERROR", error: msg });
      }
    }

    // ── GET /whatsapp-session/web-qr ──────────────────────────────────────
    // Busca o QR code atual da sessão no servidor EC2.
    if (req.method === "GET" && action === "web-qr") {
      const connectionId = url.searchParams.get("connection_id");

      if (!connectionId) {
        return jsonResponse({ error: "Missing connection_id" }, 400);
      }

      if (!getBaileysUrl()) {
        return jsonResponse({ ok: false, code: "NOT_CONFIGURED", error: "BAILEYS_SERVER_URL não configurado." });
      }

      try {
        const res = await baileysGet(`/session/${connectionId}/qr`);
        const body = await res.json().catch(() => ({})) as Record<string, unknown>;

        const qr = (body.qr as string) ?? null;

        if (qr) {
          await supabase
            .from("whatsapp_connections")
            .update({ qr_code: qr, status: "scanning", last_activity: new Date().toISOString() })
            .eq("id", connectionId);
        }

        return jsonResponse({ ok: !!qr, qr, raw: body });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse({ ok: false, code: "BAILEYS_ERROR", error: msg });
      }
    }

    // ── POST /whatsapp-session/web-send ───────────────────────────────────
    // Envia uma mensagem via servidor EC2 (conexão web/Baileys).
    if (req.method === "POST" && action === "web-send") {
      const { connection_id, client_id, number, message } = await req.json();

      if (!connection_id || !number || !message) {
        return jsonResponse({ error: "Missing connection_id, number or message" }, 400);
      }

      const { data: conn } = await supabase
        .from("whatsapp_connections")
        .select("client_id, connection_type, status")
        .eq("id", connection_id)
        .maybeSingle();

      const effectiveClientId = client_id ?? conn?.client_id ?? null;

      if (!getBaileysUrl()) {
        return jsonResponse({ ok: false, code: "NOT_CONFIGURED", error: "BAILEYS_SERVER_URL não configurado." });
      }

      try {
        const res = await baileysPost(`/session/${connection_id}/send`, { number, message });
        const body = await res.json().catch(() => ({})) as Record<string, unknown>;
        const isOk = res.status >= 200 && res.status < 300;

        await supabase.from("system_logs").insert({
          client_id: effectiveClientId,
          level: isOk ? "INFO" : "ERROR",
          event_type: isOk ? "web_send_success" : "web_send_failed",
          message: isOk
            ? `[web_send] Mensagem enviada para ${number} via conexão ${connection_id}`
            : `[web_send] FALHOU ao enviar para ${number} — HTTP ${res.status}`,
          payload: { connection_id, number, http_status: res.status, response: body },
        });

        if (isOk) {
          await supabase.from("messages").insert({
            connection_id,
            client_id: effectiveClientId,
            direction: "outbound",
            from_number: connection_id,
            to_number: number,
            body: message,
            ai_response: false,
            processed: true,
            processed_at: new Date().toISOString(),
            external_message_id: (body.messageId as string) ?? `web-${Date.now()}`,
          });

          return jsonResponse({ ok: true, message: `Mensagem enviada para ${number}.`, ...body });
        }

        return jsonResponse({
          ok: false,
          code: "SEND_ERROR",
          error: (body.error as string) ?? `HTTP ${res.status}`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse({ ok: false, code: "BAILEYS_ERROR", error: msg });
      }
    }

    // ── POST /whatsapp-session/web-delete ─────────────────────────────────
    // Encerra e remove uma sessão do servidor EC2.
    if (req.method === "POST" && action === "web-delete") {
      const { connection_id, client_id } = await req.json();

      if (!connection_id) {
        return jsonResponse({ error: "Missing connection_id" }, 400);
      }

      const { data: conn } = await supabase
        .from("whatsapp_connections")
        .select("client_id")
        .eq("id", connection_id)
        .maybeSingle();

      const effectiveClientId = client_id ?? conn?.client_id ?? null;

      if (!getBaileysUrl()) {
        return jsonResponse({ ok: false, code: "NOT_CONFIGURED", error: "BAILEYS_SERVER_URL não configurado." });
      }

      try {
        await baileysDelete(`/session/${connection_id}`);
      } catch {
        // best effort — proceed to update DB regardless
      }

      await supabase
        .from("whatsapp_connections")
        .update({ status: "disconnected", qr_code: null, last_activity: new Date().toISOString() })
        .eq("id", connection_id);

      await supabase.from("system_logs").insert({
        client_id: effectiveClientId,
        level: "INFO",
        event_type: "web_session_deleted",
        message: `Sessão web encerrada para conexão ${connection_id}`,
        payload: { connection_id },
      });

      return jsonResponse({ ok: true, status: "disconnected" });
    }

    return jsonResponse({ error: "Unknown action" }, 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[whatsapp-session] Unhandled error:", msg);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
