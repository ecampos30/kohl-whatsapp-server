import React from 'react';
import { Plus, Send, Bot, Users } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';

interface QuickActionsProps {
  account: WhatsAppAccount;
}

export function QuickActions({ account }: QuickActionsProps) {
  const actions = [
    {
      title: 'Criar Fluxo',
      description: 'Novo fluxo de automação',
      icon: Plus,
      color: 'blue',
      action: () => console.log('Create flow')
    },
    {
      title: 'Enviar Campanha',
      description: 'Disparar mensagem agora',
      icon: Send,
      color: 'green',
      action: () => console.log('Send campaign')
    },
    {
      title: 'Configurar IA',
      description: 'Ajustar persona do SAC',
      icon: Bot,
      color: 'purple',
      action: () => console.log('Configure AI')
    },
    {
      title: 'Importar Leads',
      description: 'Upload de planilha CSV',
      icon: Users,
      color: 'orange',
      action: () => console.log('Import leads')
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <button
              key={index}
              onClick={action.action}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all text-left group"
            >
              <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
                action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                action.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' :
                'bg-orange-100 group-hover:bg-orange-200'
              }`}>
                <Icon className={`h-5 w-5 ${
                  action.color === 'blue' ? 'text-blue-600' :
                  action.color === 'green' ? 'text-green-600' :
                  action.color === 'purple' ? 'text-purple-600' :
                  'text-orange-600'
                }`} />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}