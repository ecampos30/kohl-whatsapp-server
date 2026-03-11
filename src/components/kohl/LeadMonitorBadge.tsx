import React from 'react';
import { UserCheck, AlertTriangle, Bot } from 'lucide-react';
import { HandoffMap, getExpiryLabel } from '../../services/handoffService';

interface LeadMonitorBadgeProps {
  handoffMap: HandoffMap;
  className?: string;
}

export function LeadMonitorBadge({ handoffMap, className = '' }: LeadMonitorBadgeProps) {
  const activeEntries = Object.values(handoffMap).filter(
    (e) => e.paused && new Date(e.expires_at) > new Date()
  );
  const criticalEntries = activeEntries.filter(
    (e) => (new Date(e.expires_at).getTime() - Date.now()) < 10 * 60 * 1000
  );

  if (activeEntries.length === 0) return null;

  const isCritical = criticalEntries.length > 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
        isCritical
          ? 'bg-red-100 text-red-700 animate-pulse'
          : 'bg-amber-100 text-amber-800'
      } ${className}`}
      title={
        isCritical
          ? `${criticalEntries.length} atendimento(s) expirando em breve`
          : `${activeEntries.length} em atendimento humano`
      }
    >
      {isCritical ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <UserCheck className="h-3 w-3" />
      )}
      {activeEntries.length}
    </span>
  );
}

interface MonitorAlertListProps {
  handoffMap: HandoffMap;
}

export function MonitorAlertList({ handoffMap }: MonitorAlertListProps) {
  const entries = Object.entries(handoffMap)
    .filter(([, e]) => e.paused && new Date(e.expires_at) > new Date())
    .sort((a, b) => new Date(a[1].expires_at).getTime() - new Date(b[1].expires_at).getTime());

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bot className="h-10 w-10 text-green-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">Todos os leads estao com o bot ativo</p>
        <p className="text-xs text-gray-500 mt-1">Nenhum atendimento humano em andamento</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([jid, entry]) => {
        const remaining = new Date(entry.expires_at).getTime() - Date.now();
        const isCritical = remaining < 10 * 60 * 1000;
        const phone = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');

        return (
          <div
            key={jid}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              isCritical
                ? 'border-red-200 bg-red-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isCritical ? 'bg-red-100' : 'bg-amber-100'}`}>
                {isCritical ? (
                  <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-red-600' : 'text-amber-600'}`} />
                ) : (
                  <UserCheck className="h-4 w-4 text-amber-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{phone}</p>
                <p className={`text-xs ${isCritical ? 'text-red-600 font-semibold' : 'text-amber-700'}`}>
                  {getExpiryLabel(entry)}
                </p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              entry.origin === 'panel'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {entry.origin === 'panel' ? 'Painel' : 'WhatsApp'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
