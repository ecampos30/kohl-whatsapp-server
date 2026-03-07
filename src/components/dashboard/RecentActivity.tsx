import React from 'react';
import { Clock, MessageCircle, UserPlus, Bot } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';

interface RecentActivityProps {
  account: WhatsAppAccount;
}

const activities = [
  {
    id: 1,
    type: 'message',
    title: 'Nova mensagem recebida',
    description: 'Lead Maria Silva enviou: "Quero mais informações sobre o curso"',
    time: '2 min atrás',
    icon: MessageCircle,
    color: 'blue'
  },
  {
    id: 2,
    type: 'lead',
    title: 'Novo lead qualificado',
    description: 'João Santos foi qualificado com score 85 (Quente)',
    time: '5 min atrás',
    icon: UserPlus,
    color: 'green'
  },
  {
    id: 3,
    type: 'ai',
    title: 'IA resolveu atendimento',
    description: 'SAC automatizado respondeu dúvida sobre preços',
    time: '8 min atrás',
    icon: Bot,
    color: 'purple'
  },
  {
    id: 4,
    type: 'campaign',
    title: 'Campanha enviada',
    description: 'Fluxo "Oferta Especial" disparado para 156 leads',
    time: '15 min atrás',
    icon: Clock,
    color: 'orange'
  }
];

export function RecentActivity({ account }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Atividade Recente</h2>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          
          return (
            <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`p-2 rounded-lg ${
                activity.color === 'blue' ? 'bg-blue-100' :
                activity.color === 'green' ? 'bg-green-100' :
                activity.color === 'purple' ? 'bg-purple-100' :
                'bg-orange-100'
              }`}>
                <Icon className={`h-4 w-4 ${
                  activity.color === 'blue' ? 'text-blue-600' :
                  activity.color === 'green' ? 'text-green-600' :
                  activity.color === 'purple' ? 'text-purple-600' :
                  'text-orange-600'
                }`} />
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{activity.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <span className="text-xs text-gray-500 mt-2 block">{activity.time}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas as atividades
        </button>
      </div>
    </div>
  );
}