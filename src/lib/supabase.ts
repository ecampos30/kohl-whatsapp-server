import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface SystemLog {
  id: string;
  client_id: string | null;
  level: LogLevel;
  event_type: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface WhatsAppConnection {
  id: string;
  client_id: string;
  phone_number: string;
  display_name: string;
  status: 'scanning' | 'connected' | 'disconnected' | 'error';
  connection_type: 'web' | 'api_oficial';
  qr_code: string | null;
  last_activity: string | null;
  api_credentials: Record<string, unknown>;
  session_data: Record<string, unknown>;
  created_at: string;
}

export interface AIConfig {
  id: string;
  connection_id: string;
  client_id: string;
  openai_key_last4: string;
  model: string;
  max_tokens: number;
  temperature: number;
  persona_instructions: string;
  escalation_triggers: string[];
  confidence_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  connection_id: string;
  client_id: string;
  external_message_id: string | null;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  body: string;
  ai_response: boolean;
  ai_confidence: number | null;
  processed: boolean;
  processed_at: string | null;
  timestamp: string;
}

export interface BotControl {
  id: string;
  connection_id: string;
  client_id: string;
  is_paused: boolean;
  paused_at: string | null;
  pause_reason: string;
  updated_at: string;
}
