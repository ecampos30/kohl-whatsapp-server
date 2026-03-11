import { supabase } from '../lib/supabase';

export interface HandoffEntry {
  paused: boolean;
  paused_at: string;
  expires_at: string;
  origin: 'panel' | 'whatsapp';
}

export type HandoffMap = Record<string, HandoffEntry>;

const HANDOFF_DURATION_MS = 60 * 60 * 1000;

function parseHandoffMap(raw: string | null): HandoffMap {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as HandoffMap;
  } catch {
    return {};
  }
}

export async function getHandoffMap(connectionId: string): Promise<HandoffMap> {
  const { data } = await supabase
    .from('bot_controls')
    .select('pause_reason')
    .eq('connection_id', connectionId)
    .maybeSingle();

  return parseHandoffMap(data?.pause_reason ?? null);
}

export function isContactPausedInMap(map: HandoffMap, remoteJid: string): boolean {
  const entry = map[remoteJid];
  if (!entry || !entry.paused) return false;
  return new Date(entry.expires_at) > new Date();
}

export async function isContactPaused(connectionId: string, remoteJid: string): Promise<boolean> {
  const map = await getHandoffMap(connectionId);
  return isContactPausedInMap(map, remoteJid);
}

async function writeHandoffMap(connectionId: string, clientId: string, map: HandoffMap): Promise<void> {
  await supabase.from('bot_controls').upsert(
    {
      connection_id: connectionId,
      client_id: clientId,
      pause_reason: JSON.stringify(map),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'connection_id' }
  );
}

export async function pauseContact(
  connectionId: string,
  clientId: string,
  remoteJid: string,
  origin: 'panel' | 'whatsapp'
): Promise<void> {
  const map = await getHandoffMap(connectionId);
  const now = new Date();
  map[remoteJid] = {
    paused: true,
    paused_at: now.toISOString(),
    expires_at: new Date(now.getTime() + HANDOFF_DURATION_MS).toISOString(),
    origin,
  };
  await writeHandoffMap(connectionId, clientId, map);
}

export async function resumeContact(
  connectionId: string,
  clientId: string,
  remoteJid: string
): Promise<void> {
  const map = await getHandoffMap(connectionId);
  delete map[remoteJid];
  await writeHandoffMap(connectionId, clientId, map);
}

export async function clearExpiredEntries(connectionId: string, clientId: string): Promise<void> {
  const map = await getHandoffMap(connectionId);
  const now = new Date();
  let changed = false;
  for (const jid of Object.keys(map)) {
    if (new Date(map[jid].expires_at) <= now) {
      delete map[jid];
      changed = true;
    }
  }
  if (changed) {
    await writeHandoffMap(connectionId, clientId, map);
  }
}

export function getExpiryLabel(entry: HandoffEntry): string {
  const exp = new Date(entry.expires_at);
  const remaining = exp.getTime() - Date.now();
  if (remaining <= 0) return 'Expirado';
  const mins = Math.ceil(remaining / 60000);
  if (mins < 60) return `Expira em ${mins} min`;
  return `Expira às ${exp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
