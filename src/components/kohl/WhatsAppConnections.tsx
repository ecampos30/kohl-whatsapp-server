import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Smartphone, Wifi, WifiOff, QrCode, Settings, Trash2, Key, Globe,
  AlertTriangle, CheckCircle, PauseCircle, PlayCircle, RefreshCw,
  FlaskConical, ChevronDown, ChevronUp, Clock, Server, X, Power, Send,
} from 'lucide-react';
import { startSession, deleteSession, sendSessionMessage } from '../../integrations/whatsapp/webSession';
import { WhatsAppConnection } from '../../types/kohl-system';
import { QRCodeDisplay } from './QRCodeDisplay';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface WhatsAppConnectionsProps {
  connections: WhatsAppConnection[];
  onAddConnection: () => void;
  onDeleteConnection: (id: string) => void;
  onConfigureConnection: (id: string) => void;
  clientId?: string;
}

interface HealthResult {
  ok: boolean;
  message?: string;
  error?: string;
  code?: string;
  http_status?: number;
  whatsapp_message_id?: string;
}

interface SystemLog {
  id: string;
  event_type: string;
  message: string;
  level: string;
  created_at: string;
}

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? SUPABASE_ANON_KEY;
}

export function WhatsAppConnections({
  connections,
  onAddConnection,
  onDeleteConnection,
  onConfigureConnection,
  clientId,
}: WhatsAppConnectionsProps) {
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [showApiConfig, setShowApiConfig] = useState<string | null>(null);
  const [pausedConnections, setPausedConnections] = useState<Set<string>>(new Set());
  const [togglingPause, setTogglingPause] = useState<string | null>(null);
  const [healthResults, setHealthResults] = useState<Record<string, HealthResult>>({});
  const [healthLoading, setHealthLoading] = useState<Set<string>>(new Set());
  const [testSendLoading, setTestSendLoading] = useState<Set<string>>(new Set());
  const [testSendResults, setTestSendResults] = useState<Record<string, HealthResult>>({});
  const [resetLoading, setResetLoading] = useState<Set<string>>(new Set());
  const [webStartLoading, setWebStartLoading] = useState<Set<string>>(new Set());
  const [webDeleteLoading, setWebDeleteLoading] = useState<Set<string>>(new Set());
  const [webSendLoading, setWebSendLoading] = useState<Set<string>>(new Set());
  const [webResults, setWebResults] = useState<Record<string, HealthResult>>({});
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [connectionLogs, setConnectionLogs] = useState<Record<string, SystemLog[]>>({});
  const [logsLoading, setLogsLoading] = useState<Set<string>>(new Set());

  const isValidUUID = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  useEffect(() => {
    if (!clientId || !isValidUUID(clientId)) return;
    supabase
      .from('bot_controls')
      .select('connection_id, is_paused')
      .eq('client_id', clientId)
      .then(({ data }) => {
        if (data) {
          const paused = new Set(data.filter(r => r.is_paused).map(r => r.connection_id as string));
          setPausedConnections(paused);
        }
      });
  }, [clientId]);

  const handleTogglePause = async (connectionId: string) => {
    if (!clientId) return;
    setTogglingPause(connectionId);
    const isPaused = !pausedConnections.has(connectionId);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-webhook/toggle-pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ connection_id: connectionId, client_id: clientId, is_paused: isPaused }),
      });
      const data = await res.json();
      if (data.success) {
        setPausedConnections(prev => {
          const next = new Set(prev);
          if (isPaused) next.add(connectionId); else next.delete(connectionId);
          return next;
        });
        await logger.info(
          isPaused ? 'bot_paused' : 'bot_resumed',
          `Bot ${isPaused ? 'pausado' : 'retomado'} para conexao ${connectionId}`,
          { connectionId },
          clientId
        );
      }
    } catch (err) {
      console.error('[WhatsAppConnections] Erro ao alternar pausa:', err);
    }
    setTogglingPause(null);
  };

  const handleHealthcheck = async (connectionId: string) => {
    setHealthLoading(prev => new Set(prev).add(connectionId));
    setHealthResults(prev => ({ ...prev, [connectionId]: undefined as unknown as HealthResult }));
    try {
      const token = await getAuthToken();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-session/healthcheck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ connection_id: connectionId, client_id: clientId }),
      });
      const data: HealthResult = await res.json();
      setHealthResults(prev => ({ ...prev, [connectionId]: data }));
    } catch (err) {
      setHealthResults(prev => ({
        ...prev,
        [connectionId]: { ok: false, error: 'Erro de rede ao testar conexão.' },
      }));
    }
    setHealthLoading(prev => { const s = new Set(prev); s.delete(connectionId); return s; });
  };

  const handleTestSend = async (connectionId: string) => {
    setTestSendLoading(prev => new Set(prev).add(connectionId));
    setTestSendResults(prev => ({ ...prev, [connectionId]: undefined as unknown as HealthResult }));
    try {
      const token = await getAuthToken();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-session/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ connection_id: connectionId, client_id: clientId }),
      });
      const data: HealthResult = await res.json();
      setTestSendResults(prev => ({ ...prev, [connectionId]: data }));
    } catch (err) {
      setTestSendResults(prev => ({
        ...prev,
        [connectionId]: { ok: false, error: 'Erro de rede ao enviar mensagem de teste.' },
      }));
    }
    setTestSendLoading(prev => { const s = new Set(prev); s.delete(connectionId); return s; });
  };

  const handleReset = async (connectionId: string) => {
    setResetLoading(prev => new Set(prev).add(connectionId));
    try {
      const token = await getAuthToken();
      await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-session/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ connection_id: connectionId, client_id: clientId }),
      });
    } catch (err) {
      console.error('[WhatsAppConnections] Erro ao reiniciar sessão:', err);
    }
    setResetLoading(prev => { const s = new Set(prev); s.delete(connectionId); return s; });
  };

  const handleWebStart = async (connectionId: string) => {
    setWebStartLoading(prev => new Set(prev).add(connectionId));
    setWebResults(prev => ({ ...prev, [connectionId]: undefined as unknown as HealthResult }));
    const res = await startSession(connectionId);
    setWebResults(prev => ({
      ...prev,
      [connectionId]: {
        ok: res.ok,
        message: res.ok ? 'Sessao iniciada. Clique em "Ver QR" para escanear.' : undefined,
        error: res.error,
        code: res.code,
      },
    }));
    setWebStartLoading(prev => { const s = new Set(prev); s.delete(connectionId); return s; });
    if (res.ok) setShowQRCode(connectionId);
  };

  const handleWebDelete = async (connectionId: string) => {
    setWebDeleteLoading(prev => new Set(prev).add(connectionId));
    setWebResults(prev => ({ ...prev, [connectionId]: undefined as unknown as HealthResult }));
    const res = await deleteSession(connectionId);
    setWebResults(prev => ({
      ...prev,
      [connectionId]: {
        ok: res.ok,
        message: res.ok ? 'Sessao encerrada com sucesso.' : undefined,
        error: res.error,
      },
    }));
    setWebDeleteLoading(prev => { const s = new Set(prev); s.delete(connectionId); return s; });
  };

  const handleWebSend = async (connectionId: string, number: string) => {
    if (!number) return;
    setWebSendLoading(prev => new Set(prev).add(connectionId));
    setWebResults(prev => ({ ...prev, [connectionId]: undefined as unknown as HealthResult }));
    const res = await sendSessionMessage(connectionId, number, '[TESTE KOHL] Mensagem de teste via WhatsApp Web / Baileys.');
    setWebResults(prev => ({
      ...prev,
      [connectionId]: {
        ok: res.ok,
        message: res.ok ? `Mensagem enviada para ${number}.` : undefined,
        error: res.error,
      },
    }));
    setWebSendLoading(prev => { const s = new Set(prev); s.delete(connectionId); return s; });
  };

  const loadLogs = useCallback(async (connectionId: string) => {
    setLogsLoading(prev => new Set(prev).add(connectionId));
    const { data } = await supabase
      .from('system_logs')
      .select('id, event_type, message, level, created_at')
      .contains('payload', { connection_id: connectionId })
      .order('created_at', { ascending: false })
      .limit(6);
    setConnectionLogs(prev => ({ ...prev, [connectionId]: data ?? [] }));
    setLogsLoading(prev => { const s = new Set(prev); s.delete(connectionId); return s; });
  }, []);

  const toggleLogs = (connectionId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(connectionId)) {
        next.delete(connectionId);
      } else {
        next.add(connectionId);
        loadLogs(connectionId);
      }
      return next;
    });
  };

  const getStatusColor = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'connected': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'disconnected': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'scanning': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'connected': return <Wifi className="h-3.5 w-3.5" />;
      case 'disconnected': return <WifiOff className="h-3.5 w-3.5" />;
      case 'scanning': return <QrCode className="h-3.5 w-3.5 animate-pulse" />;
      case 'error': return <AlertTriangle className="h-3.5 w-3.5" />;
      default: return <Smartphone className="h-3.5 w-3.5" />;
    }
  };

  const getStatusLabel = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'scanning': return 'Aguardando QR';
      case 'error': return 'Erro';
      default: return status;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600';
      case 'WARN': return 'text-amber-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Conexões WhatsApp</h2>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie e monitore suas conexões de WhatsApp</p>
        </div>
        {connections.length < 5 && (
          <button
            onClick={onAddConnection}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar WhatsApp</span>
          </button>
        )}
      </div>

      {/* Runtime notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
        <Server className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">Sobre os tipos de conexão</p>
          <p className="text-blue-800 mt-1">
            <strong>Business API</strong> — usa credenciais Meta, healthcheck e envio via API oficial.{' '}
            <strong>Web QR</strong> — conecta via servidor Baileys (EC2). Inicie a sessao, escaneie o QR e o status atualiza automaticamente.
          </p>
        </div>
      </div>

      {/* Connections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {connections.map((connection) => {
          const isApi = connection.connectionType === 'api';
          const healthRes = healthResults[connection.id];
          const testRes = testSendResults[connection.id];
          const logsOpen = expandedLogs.has(connection.id);

          return (
            <div key={connection.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isApi ? 'bg-blue-50' : 'bg-green-50'}`}>
                      {isApi
                        ? <Key className="h-5 w-5 text-blue-600" />
                        : <Smartphone className="h-5 w-5 text-green-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{connection.name}</h3>
                      <p className="text-gray-500 text-xs">{connection.number || '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isApi ? 'WhatsApp Business API' : 'WhatsApp Web QR'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onConfigureConnection(connection.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Configurar"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteConnection(connection.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Status row */}
                <div className="flex items-center justify-between mt-4">
                  <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(connection.status)}`}>
                    {getStatusIcon(connection.status)}
                    <span>{getStatusLabel(connection.status)}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Últ. atividade: {new Date(connection.lastActivity).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>


                {/* Stats */}
                <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
                  <span>{connection.messageCount} msgs hoje</span>
                  <span className={`font-medium ${pausedConnections.has(connection.id) ? 'text-orange-600' : 'text-green-600'}`}>
                    Bot {pausedConnections.has(connection.id) ? 'pausado' : 'ativo'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-5 pb-4 space-y-2">
                {/* Pause / Resume */}
                <button
                  onClick={() => handleTogglePause(connection.id)}
                  disabled={togglingPause === connection.id}
                  className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    pausedConnections.has(connection.id)
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {pausedConnections.has(connection.id)
                    ? <><PlayCircle className="h-3.5 w-3.5" /><span>Retomar bot de IA</span></>
                    : <><PauseCircle className="h-3.5 w-3.5" /><span>Pausar bot de IA</span></>}
                </button>

                {/* Business API actions */}
                {isApi && (
                  <>
                    {(connection.status === 'disconnected' || connection.status === 'error') && (
                      <button
                        onClick={() => setShowApiConfig(connection.id)}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        <Key className="h-3.5 w-3.5" />
                        <span>Configurar Business API</span>
                      </button>
                    )}

                    {/* Healthcheck button */}
                    <button
                      onClick={() => handleHealthcheck(connection.id)}
                      disabled={healthLoading.has(connection.id)}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      {healthLoading.has(connection.id)
                        ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /><span>Verificando API...</span></>
                        : <><CheckCircle className="h-3.5 w-3.5" /><span>Testar WhatsApp (healthcheck)</span></>}
                    </button>

                    {/* Healthcheck result */}
                    {healthRes && (
                      <div className={`rounded-lg px-3 py-2 text-xs border ${healthRes.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <div className="flex items-start space-x-1.5">
                          {healthRes.ok
                            ? <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
                          <span>{healthRes.ok ? healthRes.message : healthRes.error}</span>
                        </div>
                        {healthRes.http_status && (
                          <p className="mt-1 opacity-70">HTTP {healthRes.http_status}{healthRes.code ? ` · ${healthRes.code}` : ''}</p>
                        )}
                      </div>
                    )}

                    {/* Test send button */}
                    <button
                      onClick={() => handleTestSend(connection.id)}
                      disabled={testSendLoading.has(connection.id)}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      {testSendLoading.has(connection.id)
                        ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /><span>Enviando...</span></>
                        : <><FlaskConical className="h-3.5 w-3.5" /><span>Enviar mensagem de teste</span></>}
                    </button>

                    {/* Test send result */}
                    {testRes && (
                      <div className={`rounded-lg px-3 py-2 text-xs border ${testRes.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <div className="flex items-start space-x-1.5">
                          {testRes.ok
                            ? <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
                          <span>{testRes.ok ? testRes.message : testRes.error}</span>
                        </div>
                        {testRes.whatsapp_message_id && (
                          <p className="mt-1 opacity-70">ID: {testRes.whatsapp_message_id}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Web QR actions */}
                {!isApi && (
                  <>
                    {/* Start session */}
                    {(connection.status === 'disconnected' || connection.status === 'error') && (
                      <button
                        onClick={() => handleWebStart(connection.id)}
                        disabled={webStartLoading.has(connection.id)}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                      >
                        {webStartLoading.has(connection.id)
                          ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /><span>Iniciando sessao...</span></>
                          : <><Power className="h-3.5 w-3.5" /><span>Iniciar sessao</span></>}
                      </button>
                    )}

                    {/* View QR */}
                    {(connection.status === 'scanning' || connection.status === 'connected') && (
                      <button
                        onClick={() => setShowQRCode(connection.id)}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 hover:bg-gray-700 text-white transition-colors"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Ver QR Code</span>
                      </button>
                    )}

                    {/* Test send */}
                    {connection.status === 'connected' && (
                      <button
                        onClick={() => {
                          const num = window.prompt('Numero de destino (ex: 5511999999999):');
                          if (num) handleWebSend(connection.id, num.trim());
                        }}
                        disabled={webSendLoading.has(connection.id)}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        {webSendLoading.has(connection.id)
                          ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /><span>Enviando...</span></>
                          : <><Send className="h-3.5 w-3.5" /><span>Enviar mensagem de teste</span></>}
                      </button>
                    )}

                    {/* Disconnect */}
                    {connection.status !== 'disconnected' && (
                      <button
                        onClick={() => handleWebDelete(connection.id)}
                        disabled={webDeleteLoading.has(connection.id)}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {webDeleteLoading.has(connection.id)
                          ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /><span>Desconectando...</span></>
                          : <><WifiOff className="h-3.5 w-3.5" /><span>Desconectar</span></>}
                      </button>
                    )}

                    {/* Web action result */}
                    {webResults[connection.id] && (
                      <div className={`rounded-lg px-3 py-2 text-xs border ${webResults[connection.id].ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <div className="flex items-start space-x-1.5">
                          {webResults[connection.id].ok
                            ? <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
                          <span>{webResults[connection.id].ok ? webResults[connection.id].message : webResults[connection.id].error}</span>
                        </div>
                        {webResults[connection.id].code && (
                          <p className="mt-1 opacity-70">{webResults[connection.id].code}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Reset session */}
                {connection.status !== 'disconnected' && (
                  <button
                    onClick={() => handleReset(connection.id)}
                    disabled={resetLoading.has(connection.id)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {resetLoading.has(connection.id)
                      ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /><span>Reiniciando...</span></>
                      : <><X className="h-3.5 w-3.5" /><span>Reiniciar sessão</span></>}
                  </button>
                )}
              </div>

              {/* Diagnostic logs toggle */}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => toggleLogs(connection.id)}
                  className="w-full flex items-center justify-between px-5 py-3 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Logs recentes</span>
                    {logsLoading.has(connection.id) && (
                      <RefreshCw className="h-3 w-3 animate-spin ml-1" />
                    )}
                  </div>
                  {logsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {logsOpen && (
                  <div className="px-5 pb-4 space-y-2">
                    {(connectionLogs[connection.id] ?? []).length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Nenhum log encontrado para esta conexão.</p>
                    ) : (
                      connectionLogs[connection.id].map(log => (
                        <div key={log.id} className="text-xs border-l-2 border-gray-200 pl-2 py-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className={`font-mono font-semibold ${getLogLevelColor(log.level)}`}>
                              {log.event_type}
                            </span>
                            <span className="text-gray-400">
                              {new Date(log.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-0.5 truncate" title={log.message}>{log.message}</p>
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => loadLogs(connection.id)}
                      className="text-xs text-blue-600 hover:underline mt-1"
                    >
                      Atualizar logs
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {connections.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            <Smartphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma conexão configurada</p>
            <p className="text-sm mt-1">Clique em "Adicionar WhatsApp" para começar</p>
          </div>
        )}
      </div>

      {/* Stats summary */}
      {connections.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Resumo do sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {connections.filter(c => c.connectionType === 'api').length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Business API</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {connections.filter(c => c.connectionType === 'web').length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Web QR</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {connections.filter(c => c.status === 'connected').length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Conectados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {connections.reduce((sum, c) => sum + c.messageCount, 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Msgs hoje</div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showQRCode && (
        <QRCodeDisplay
          connectionId={showQRCode}
          onClose={() => setShowQRCode(null)}
          onConnectionSuccess={(id) => {
            onConfigureConnection(id);
            setShowQRCode(null);
          }}
        />
      )}

      {showApiConfig && (
        <ApiConfigModal
          connectionId={showApiConfig}
          connection={connections.find(c => c.id === showApiConfig)}
          clientId={clientId}
          onClose={() => setShowApiConfig(null)}
          onSaved={() => setShowApiConfig(null)}
        />
      )}
    </div>
  );
}

function ApiConfigModal({
  connectionId,
  connection,
  clientId,
  onClose,
  onSaved,
}: {
  connectionId: string;
  connection?: WhatsAppConnection;
  clientId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: '',
    appId: '',
    appSecret: '',
  });
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleValidate = async () => {
    if (!formData.accessToken || !formData.phoneNumberId || !formData.businessAccountId) {
      setResult({ ok: false, message: 'Preencha Access Token, Phone Number ID e Business Account ID.' });
      return;
    }

    setValidating(true);
    setResult(null);

    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${formData.phoneNumberId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${formData.accessToken}` },
        }
      );
      const body = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: `Credenciais válidas. Número verificado: ${body.display_phone_number ?? formData.phoneNumberId}` });
      } else {
        const errMsg = body?.error?.message ?? `HTTP ${res.status}`;
        setResult({ ok: false, message: `Erro da Meta API: ${errMsg}` });
      }
    } catch (err) {
      setResult({ ok: false, message: 'Erro de rede ao contatar a Meta API.' });
    }

    setValidating(false);
  };

  const handleSave = async () => {
    if (!result?.ok) return;
    setSaving(true);

    const token = await getAuthToken();
    await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-webhook/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        connection_id: connectionId,
        client_id: clientId,
        status: 'connected',
      }),
    });

    await supabase
      .from('whatsapp_connections')
      .update({
        api_credentials: {
          accessToken: formData.accessToken,
          phoneNumberId: formData.phoneNumberId,
          businessAccountId: formData.businessAccountId,
          appId: formData.appId,
          appSecret: formData.appSecret,
          webhookVerifyToken: formData.webhookVerifyToken,
        },
        connection_type: 'api_oficial',
        status: 'connected',
        last_activity: new Date().toISOString(),
      })
      .eq('id', connectionId);

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Configurar Business API</h2>
            <p className="text-gray-500 text-sm">{connection?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 text-sm text-blue-800">
          Acesse o{' '}
          <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
            Meta Business Manager
          </a>
          {' '}→ WhatsApp → Configuração para obter as credenciais abaixo.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Access Token *', key: 'accessToken', type: 'password', placeholder: 'EAAxxxxxxxxxx...' },
            { label: 'Phone Number ID *', key: 'phoneNumberId', type: 'text', placeholder: '123456789012345' },
            { label: 'Business Account ID *', key: 'businessAccountId', type: 'text', placeholder: '123456789012345' },
            { label: 'App ID', key: 'appId', type: 'text', placeholder: '123456789012345' },
            { label: 'App Secret', key: 'appSecret', type: 'password', placeholder: 'xxxxxxxxxxxxxxxx' },
            { label: 'Webhook Verify Token', key: 'webhookVerifyToken', type: 'text', placeholder: 'meu-token-secreto' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                value={formData[key as keyof typeof formData]}
                onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <button
            onClick={handleValidate}
            disabled={validating}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {validating
              ? <><RefreshCw className="h-4 w-4 animate-spin" /><span>Verificando com Meta API...</span></>
              : <><Globe className="h-4 w-4" /><span>Testar credenciais (chamada real)</span></>}
          </button>

          {result && (
            <div className={`rounded-lg px-4 py-3 text-sm border flex items-start space-x-2 ${result.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {result.ok ? <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!result?.ok || saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar e ativar conexão'}
          </button>
        </div>
      </div>
    </div>
  );
}
