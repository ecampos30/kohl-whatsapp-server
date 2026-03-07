import React, { useState } from 'react';
import { Search, Download, Filter, Eye } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';

interface ChatLogProps {
  account: WhatsAppAccount;
}

const mockChatLogs = [
  {
    id: 1,
    leadName: 'Maria Silva',
    leadPhone: '+55 11 99999-1111',
    timestamp: '2025-01-27 14:30:00',
    messages: 12,
    handoffReason: null,
    resolved: true,
    satisfaction: 4.5
  },
  {
    id: 2,
    leadName: 'João Santos',
    leadPhone: '+55 11 99999-2222',
    timestamp: '2025-01-27 13:15:00',
    messages: 8,
    handoffReason: 'Solicitou falar com humano',
    resolved: false,
    satisfaction: null
  },
  {
    id: 3,
    leadName: 'Ana Costa',
    leadPhone: '+55 11 99999-3333',
    timestamp: '2025-01-27 12:45:00',
    messages: 15,
    handoffReason: null,
    resolved: true,
    satisfaction: 5.0
  }
];

export function ChatLog({ account }: ChatLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<number | null>(null);

  const filteredLogs = mockChatLogs.filter(log =>
    log.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.leadPhone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
        </button>
        
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </button>
      </div>

      <div className="space-y-2">
        {filteredLogs.map((log) => (
          <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-medium text-gray-900">{log.leadName}</h3>
                  <span className="text-sm text-gray-600">{log.leadPhone}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {log.resolved ? 'Resolvido' : 'Pendente'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>📅 {new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                  <span>💬 {log.messages} mensagens</span>
                  {log.satisfaction && (
                    <span>⭐ {log.satisfaction}/5.0</span>
                  )}
                  {log.handoffReason && (
                    <span className="text-orange-600">🔄 {log.handoffReason}</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
            
            {selectedLog === log.id && (
              <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 -mx-4 px-4 rounded-b-lg">
                <div className="space-y-2">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <span className="text-xs text-blue-600 font-medium">USUÁRIO</span>
                    <p className="text-sm text-blue-900 mt-1">Olá, quero informações sobre os cursos disponíveis</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border">
                    <span className="text-xs text-purple-600 font-medium">IA ASSISTENTE</span>
                    <p className="text-sm text-gray-900 mt-1">
                      Olá! Fico feliz em ajudar com informações sobre nossos cursos. 
                      Temos várias opções disponíveis. Você tem alguma área específica de interesse?
                    </p>
                  </div>
                  
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <span className="text-xs text-blue-600 font-medium">USUÁRIO</span>
                    <p className="text-sm text-blue-900 mt-1">Tenho interesse em programação</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}