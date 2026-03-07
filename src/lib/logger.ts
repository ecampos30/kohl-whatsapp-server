import { supabase, LogLevel } from './supabase';

async function writeLog(
  level: LogLevel,
  eventType: string,
  message: string,
  payload: Record<string, unknown> = {},
  clientId?: string
) {
  const entry = {
    client_id: clientId ?? null,
    level,
    event_type: eventType,
    message,
    payload,
  };

  console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](
    `[${level}] [${eventType}] ${message}`,
    Object.keys(payload).length ? payload : ''
  );

  const { error } = await supabase.from('system_logs').insert(entry);
  if (error) {
    console.error('[logger] Failed to write log to DB:', error.message);
  }
}

export const logger = {
  info: (eventType: string, message: string, payload?: Record<string, unknown>, clientId?: string) =>
    writeLog('INFO', eventType, message, payload, clientId),

  warn: (eventType: string, message: string, payload?: Record<string, unknown>, clientId?: string) =>
    writeLog('WARN', eventType, message, payload, clientId),

  error: (eventType: string, message: string, payload?: Record<string, unknown>, clientId?: string) =>
    writeLog('ERROR', eventType, message, payload, clientId),
};
