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
}
    }
        }
      )
  }
)
    }
        }
      )
  }
)
}
    }
}
}