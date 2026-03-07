import { supabase } from '../../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function getAuthToken(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? SUPABASE_ANON_KEY;
  } catch {
    return SUPABASE_ANON_KEY;
  }
}

function edgeFunctionUrl(action: string): string {
  return `${SUPABASE_URL}/functions/v1/whatsapp-session/${action}`;
}

async function post(action: string, body: Record<string, unknown>): Promise<Response> {
  const token = await getAuthToken();
  return fetch(edgeFunctionUrl(action), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}


export interface SessionStatus {
  ok: boolean;
  status?: 'scanning' | 'connected' | 'disconnected' | 'error';
  qr?: string;
  error?: string;
  code?: string;
}

export async function startSession(connectionId: string): Promise<SessionStatus> {
  try {
    const res = await post('web-start', { connection_id: connectionId });
    return await res.json();
  } catch (err) {
    return { ok: false, error: 'Erro de rede ao iniciar sessao.' };
  }
}

export async function getSessionStatus(connectionId: string): Promise<SessionStatus> {
  try {
    const token = await getAuthToken();
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/whatsapp-session/web-status?connection_id=${encodeURIComponent(connectionId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return await res.json();
  } catch (err) {
    return { ok: false, error: 'Erro de rede ao consultar status.' };
  }
}

export async function getSessionQr(connectionId: string): Promise<SessionStatus> {
  try {
    const token = await getAuthToken();
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/whatsapp-session/web-qr?connection_id=${encodeURIComponent(connectionId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return await res.json();
  } catch (err) {
    return { ok: false, error: 'Erro de rede ao buscar QR.' };
  }
}

export async function sendSessionMessage(
  connectionId: string,
  number: string,
  message: string
): Promise<SessionStatus> {
  try {
    const res = await post('web-send', { connection_id: connectionId, number, message });
    return await res.json();
  } catch (err) {
    return { ok: false, error: 'Erro de rede ao enviar mensagem.' };
  }
}

export async function deleteSession(connectionId: string): Promise<SessionStatus> {
  try {
    const res = await post('web-delete', { connection_id: connectionId });
    return await res.json();
  } catch (err) {
    return { ok: false, error: 'Erro de rede ao encerrar sessao.' };
  }
}
