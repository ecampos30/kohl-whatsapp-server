import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Wifi, WifiOff, Brain, AlertTriangle, CheckCircle, RefreshCw, Clock, Webhook } from 'lucide-react';
import { supabase, SystemLog } from '../../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface SystemStatusProps {
  clientId?: string;
  connectionId?: string;
}

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'scanning' | 'error' | 'unknown';
  lastEvent: string | null;
  phone: string;
}

interface WebhookStatus {
  ok: boolean;
  lastPayload: string | null;
  lastSeen: string | null;
}

interface OpenAIStatus {
  configured: boolean;
  last4: string;
  testResult: 'idle' | 'testing' | 'ok' | 'invalid_key' | 'quota_exceeded' | 'error' | 'not_configured';
}

export function SystemStatus({ clientId, connectionId }: SystemStatusProps) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<SystemLog[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'unknown',
    lastEvent: null,
    phone: '',
  });
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>({
    ok: false,
    lastPayload: null,
    lastSeen: null,
  });
  const [openAIStatus, setOpenAIStatus] = useState<OpenAIStatus>({
    configured: false,
    last4: '',
    testResult: 'idle',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    setIsRefreshing(true);

    const logQuery = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (clientId) {
      logQuery.or(`client_id.eq.${clientId},client_id.is.null`);
    }

    const { data: allLogs } = await logQuery;
    if (allLogs) {
      setLogs(allLogs.slice(0, 20));
      setErrorLogs(allLogs.filter(l => l.level === 'ERROR').slice(0, 20));

      const connLog = allLogs.find(l =>
        ['session_connected', 'session_disconnected', 'qr_generated', 'session_error'].includes(l.event_type)
      );
      if (connLog) {
        const statusMap: Record<string, ConnectionStatus['status']> = {
          session_connected: 'connected',
          session_disconnected: 'disconnected',
          qr_generated: 'scanning',
          session_error: 'error',
        };
        setConnectionStatus(prev => ({
          ...prev,
          status: statusMap[connLog.event_type] ?? 'unknown',
          lastEvent: connLog.created_at,
        }));
      }

      const webhookLog = allLogs.find(l => l.event_type === 'webhook_received');
      if (webhookLog) {
        setWebhookStatus({
          ok: true,
          lastPayload: JSON.stringify(webhookLog.payload).slice(0, 120) + '...',
          lastSeen: webhookLog.created_at,
        });
      }
    }

    if (connectionId) {
      const { data: aiConfig } = await supabase
        .from('ai_configs')
        .select('openai_key_last4, is_active')
        .eq('connection_id', connectionId)
        .maybeSingle();

      if (aiConfig) {
        setOpenAIStatus(prev => ({
          ...prev,
          configured: !!aiConfig.openai_key_last4 && aiConfig.is_active,
          last4: aiConfig.openai_key_last4 ?? '',
        }));
      }

      const { data: conn } = await supabase
        .from('whatsapp_connections')
        .select('status, phone_number, last_activity')
        .eq('id', connectionId)
        .maybeSingle();

      if (conn) {
        setConnectionStatus(prev => ({
          ...prev,
          status: conn.status as ConnectionStatus['status'],
          lastEvent: conn.last_activity,
          phone: conn.phone_number,
        }));
      }
    }

    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, [clientId, connectionId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel('system_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_logs' },
        (payload) => {
          const newLog = payload.new as SystemLog;
          setLogs(prev => [newLog, ...prev].slice(0, 20));
          if (newLog.level === 'ERROR') {
            setErrorLogs(prev => [newLog, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleTestOpenAI = async () => {
    if (!connectionId || !clientId) return;
    setOpenAIStatus(prev => ({ ...prev, testResult: 'testing' }));
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token ?? SUPABASE_ANON_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy/test-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ connection_id: connectionId, client_id: clientId }),
      });
      const data = await res.json();
      setOpenAIStatus(prev => ({ ...prev, testResult: data.status }));
    } catch {
      setOpenAIStatus(prev => ({ ...prev, testResult: 'error' }));
    }
  };

  const statusDot = (status: ConnectionStatus['status']) => {
    const colors: Record<string, string> = {
      connected: 'bg-green-500',
      disconnected: 'bg-red-500',
      scanning: 'bg-yellow-500 animate-pulse',
      error: 'bg-red-600',
      unknown: 'bg-gray-400',
    };
    return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] ?? 'bg-gray-400'}`} />;
  };

  const levelColor = (level: string) => {
    if (level === 'ERROR') return 'text-red-600 bg-red-50';
    if (level === 'WARN') return 'text-orange-600 bg-orange-50';
    return 'text-blue-600 bg-blue-50';
  };

  const openAIResultLabel: Record<string, { label: string; color: string }> = {
    idle: { label: 'Nao testado', color: 'text-gray-500' },
    testing: { label: 'Testando...', color: 'text-gray-500' },
    ok: { label: 'OK', color: 'text-green-600' },
    invalid_key: { label: 'Chave invalida', color: 'text-red-600' },
    quota_exceeded: { label: 'Cota esgotada', color: 'text-orange-600' },
    not_configured: { label: 'Nao configurada', color: 'text-yellow-600' },
    error: { label: 'Erro de conexao', color: 'text-red-600' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Status do Sistema</h2>
          <p className="text-sm text-gray-500 mt-0.5">Monitoramento em tempo real de todos os componentes</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Atualizado: {lastRefresh.toLocaleTimeString('pt-BR')}
          </span>
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WhatsApp */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              {connectionStatus.status === 'connected' ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">WhatsApp</p>
              <div className="flex items-center space-x-1.5">
                {statusDot(connectionStatus.status)}
                <span className="text-sm font-semibold capitalize text-gray-900">
                  {connectionStatus.status === 'connected' ? 'Conectado' :
                   connectionStatus.status === 'disconnected' ? 'Desconectado' :
                   connectionStatus.status === 'scanning' ? 'Aguardando QR' :
                   connectionStatus.status === 'error' ? 'Erro' : 'Desconhecido'}
                </span>
              </div>
            </div>
          </div>
          {connectionStatus.phone && (
            <p className="text-xs text-gray-500">{connectionStatus.phone}</p>
          )}
          {connectionStatus.lastEvent && (
            <div className="flex items-center space-x-1 mt-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <p className="text-xs text-gray-400">
                {new Date(connectionStatus.lastEvent).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        {/* Webhook */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-lg ${webhookStatus.ok ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Webhook className={`h-5 w-5 ${webhookStatus.ok ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Webhook / Listener</p>
              <div className="flex items-center space-x-1.5">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${webhookStatus.ok ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-semibold text-gray-900">
                  {webhookStatus.ok ? 'Recebendo' : 'Sem atividade'}
                </span>
              </div>
            </div>
          </div>
          {webhookStatus.lastSeen && (
            <div className="flex items-center space-x-1 mb-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <p className="text-xs text-gray-400">
                {new Date(webhookStatus.lastSeen).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
          {webhookStatus.lastPayload && (
            <p className="text-xs text-gray-500 font-mono bg-gray-50 rounded p-2 truncate">
              {webhookStatus.lastPayload}
            </p>
          )}
        </div>

        {/* OpenAI */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-lg ${openAIStatus.configured ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Brain className={`h-5 w-5 ${openAIStatus.configured ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">OpenAI API Key</p>
              <div className="flex items-center space-x-1.5">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${openAIStatus.configured ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-semibold text-gray-900">
                  {openAIStatus.configured
                    ? `Configurada (...${openAIStatus.last4})`
                    : 'Nao configurada'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs font-medium ${openAIResultLabel[openAIStatus.testResult]?.color}`}>
              {openAIResultLabel[openAIStatus.testResult]?.label}
            </span>
            <button
              onClick={handleTestOpenAI}
              disabled={openAIStatus.testResult === 'testing' || !connectionId}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              Testar Conexao
            </button>
          </div>
        </div>
      </div>

      {/* Error Log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="font-semibold text-gray-900">Ultimos Erros</h3>
          {errorLogs.length > 0 && (
            <span className="ml-auto bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
              {errorLogs.length}
            </span>
          )}
        </div>
        {errorLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <CheckCircle className="h-8 w-8 mb-2 text-green-400" />
            <p className="text-sm">Nenhum erro registrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {errorLogs.map(log => (
              <div key={log.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${levelColor(log.level)}`}>
                        {log.level}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{log.event_type}</span>
                    </div>
                    <p className="text-sm text-gray-800 truncate">{log.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Activity Log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center space-x-2">
          <Activity className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Atividade Recente</h3>
          <span className="ml-auto text-xs text-gray-500">Ultimas 20 entradas</span>
        </div>
        {logs.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <p className="text-sm">Nenhum evento registrado ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="px-5 py-2.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${levelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-gray-500 font-mono flex-shrink-0 w-40 truncate">
                    {log.event_type}
                  </span>
                  <p className="text-sm text-gray-700 flex-1 truncate">{log.message}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
