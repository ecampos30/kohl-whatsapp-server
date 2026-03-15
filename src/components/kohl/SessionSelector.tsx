import React, { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, Wifi, WifiOff, QrCode, Smartphone, Key, AlertTriangle } from 'lucide-react';
import { listSessions, BaileysSession } from '../../integrations/whatsapp/webSession';
import { WhatsAppConnection } from '../../types/kohl-system';

interface SessionSelectorProps {
  connections: WhatsAppConnection[];
  selectedConnectionId: string;
  onSelect: (connectionId: string) => void;
}

export function SessionSelector({ connections, selectedConnectionId, onSelect }: SessionSelectorProps) {
  const [baileysSessions, setBaileysSession] = useState<BaileysSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    const result = await listSessions();
    if (result.ok) {
      setBaileysSession(result.sessions ?? []);
    }
    setLastRefreshed(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const getBaileysStatus = (connectionId: string): string | null => {
    const s = baileysSessions.find(s => s.id === connectionId);
    return s?.status ?? null;
  };

  const isOnline = (connectionId: string, connection: WhatsAppConnection): boolean => {
    if (connection.connectionType === 'web') {
      const s = getBaileysStatus(connectionId);
      return s === 'open' || s === 'connected' || connection.status === 'connected';
    }
    return connection.status === 'connected';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Sessao ativa para envio</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Selecione qual numero envia mensagens nas campanhas e testes
          </p>
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      <div className="space-y-2">
        {connections.map((conn) => {
          const online = isOnline(conn.id, conn);
          const isSelected = selectedConnectionId === conn.id;
          const isApi = conn.connectionType === 'api';
          const baileysStatus = getBaileysStatus(conn.id);

          return (
            <button
              key={conn.id}
              onClick={() => onSelect(conn.id)}
              className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isApi ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {isApi
                    ? <Key className="h-4 w-4 text-blue-600" />
                    : <Smartphone className="h-4 w-4 text-green-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{conn.name}</p>
                  <p className="text-xs text-gray-500">{conn.number || conn.id}</p>
                  {baileysStatus && (
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      Baileys: {baileysStatus}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {online ? (
                  <span className="flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Wifi className="h-3 w-3" />
                    <span>Online</span>
                  </span>
                ) : conn.status === 'scanning' ? (
                  <span className="flex items-center space-x-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <QrCode className="h-3 w-3" />
                    <span>Aguardando QR</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </span>
                )}

                {isSelected && (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
              </div>
            </button>
          );
        })}

        {connections.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2 opacity-40" />
            Nenhuma conexao configurada
          </div>
        )}
      </div>

      {lastRefreshed && (
        <p className="text-xs text-gray-400">
          Atualizado em {lastRefreshed.toLocaleTimeString('pt-BR')}
        </p>
      )}
    </div>
  );
}
