import React, { useState } from 'react';
import { Bot, Settings, MessageSquare, Zap } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';
import { AIConfiguration } from './AIConfiguration';
import { ChatLog } from './ChatLog';

interface AIServiceProps {
  account: WhatsAppAccount;
}

export function AIService({ account }: AIServiceProps) {
  const [activeTab, setActiveTab] = useState('config');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SAC com IA</h1>
          <p className="text-gray-600">Configure o atendimento automatizado para {account.name}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>IA Ativa</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'config', label: 'Configuração', icon: Settings },
              { id: 'logs', label: 'Histórico de Conversas', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'config' && <AIConfiguration account={account} />}
          {activeTab === 'logs' && <ChatLog account={account} />}
        </div>
      </div>
    </div>
  );
}