import { supabase } from '../lib/supabase';

// Schema real: public.kohl_bot_control
// Campos: remote_jid (PK), handoff_mode (boolean), handoff_by (text), updated_at (text)

export interface BotControlEntry {
    remote_jid: string;
    handoff_mode: boolean;
    handoff_by: string;
    updated_at: string;
}

// Busca o registro de controle do bot para um contato
export async function getBotControl(remoteJid: string): Promise<BotControlEntry | null> {
    const { data, error } = await supabase
      .from('kohl_bot_control')
      .select('remote_jid, handoff_mode, handoff_by, updated_at')
      .eq('remote_jid', remoteJid)
      .maybeSingle();

    if (error) {
          console.error('Erro ao buscar kohl_bot_control:', error.message);
          return null;
    }

    return data ?? null;
}

// Verifica se o contato está em modo humano (handoff ativo)
export async function isContactInHandoff(remoteJid: string): Promise<boolean> {
    const entry = await getBotControl(remoteJid);
    return entry?.handoff_mode === true;
}

// Ativa o modo humano para um contato (#sair / #humano)
export async function activateHandoff(
    remoteJid: string,
    handoffBy: string = 'panel'
  ): Promise<void> {
    const { error } = await supabase
      .from('kohl_bot_control')
      .upsert(
        {
                  remote_jid: remoteJid,
                  handoff_mode: true,
                  handoff_by: handoffBy,
                  updated_at: new Date().toISOString(),
        },
        { onConflict: 'remote_jid' }
            );

    if (error) {
          console.error('Erro ao ativar handoff:', error.message);
          throw error;
    }
}

// Desativa o modo humano para um contato (#bot)
export async function deactivateHandoff(
    remoteJid: string,
    handoffBy: string = 'panel'
  ): Promise<void> {
    const { error } = await supabase
      .from('kohl_bot_control')
      .upsert(
        {
                  remote_jid: remoteJid,
                  handoff_mode: false,
                  handoff_by: handoffBy,
                  updated_at: new Date().toISOString(),
        },
        { onConflict: 'remote_jid' }
            );

    if (error) {
          console.error('Erro ao desativar handoff:', error.message);
          throw error;
    }
}

// Retorna label legível do status de handoff
export function getHandoffLabel(entry: BotControlEntry | null): string {
    if (!entry) return 'Bot ativo';
    return entry.handoff_mode ? `Humano (ativado por ${entry.handoff_by})` : 'Bot ativo';
}

export interface HandoffEntry {
    paused: boolean;
    expires_at: string;
    origin: 'panel' | 'whatsapp' | string;
}

export type HandoffMap = Record<string, HandoffEntry>;

export function getExpiryLabel(entry: HandoffEntry): string {
    const remaining = new Date(entry.expires_at).getTime() - Date.now();
    if (remaining <= 0) return 'Expirado';
    const minutes = Math.floor(remaining / 60000);
    if (minutes < 60) return `Expira em ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `Expira em ${hours}h`;
}

export async function getHandoffMap(
    _connectionId: string,
    _clientId: string
): Promise<HandoffMap> {
    const { data, error } = await supabase
        .from('kohl_bot_control')
        .select('remote_jid, handoff_mode, updated_at');

    if (error) return {};

    const map: HandoffMap = {};
    for (const row of data ?? []) {
        if (row.handoff_mode) {
            const expiresAt = new Date(new Date(row.updated_at).getTime() + 60 * 60 * 1000).toISOString();
            map[row.remote_jid] = {
                paused: true,
                expires_at: expiresAt,
                origin: 'panel',
            };
        }
    }
    return map;
}

export async function pauseContact(
    remoteJid: string,
    _connectionId: string,
    _clientId: string,
    durationMinutes: number = 60
): Promise<void> {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const { error } = await supabase
        .from('kohl_bot_control')
        .upsert(
            {
                remote_jid: remoteJid,
                handoff_mode: true,
                handoff_by: 'panel',
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'remote_jid' }
        );
    if (error) throw error;
    void expiresAt;
}

export async function resumeContact(
    remoteJid: string,
    _connectionId: string,
    _clientId: string
): Promise<void> {
    const { error } = await supabase
        .from('kohl_bot_control')
        .upsert(
            {
                remote_jid: remoteJid,
                handoff_mode: false,
                handoff_by: 'panel',
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'remote_jid' }
        );
    if (error) throw error;
}

export function isContactPausedInMap(remoteJid: string, map: HandoffMap): boolean {
    const entry = map[remoteJid];
    if (!entry) return false;
    return entry.paused && new Date(entry.expires_at) > new Date();
}
