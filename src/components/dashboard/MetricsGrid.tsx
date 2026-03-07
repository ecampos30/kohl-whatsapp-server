import React from 'react';
import { MessageCircle, Users, TrendingUp, Clock } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';

interface MetricsGridProps {
  account: WhatsAppAccount;
}

const metrics = [
  {
    title: 'Mensagens Hoje',
    value: '1,247',
    change: '+12%',
    changeType: 'positive' as const,
    icon: MessageCircle,
    color: 'blue'
  },
  {
    title: 'Leads Ativos',
    value: '89',
    change: '+3',
    changeType: 'positive' as const,
    icon: Users,
    color: 'green'
  },
  {
    title: 'Taxa de Conversão',
    value: '23.5%',
    change: '+1.2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    color: 'orange'
  },
  {
    title: 'Tempo Médio Resposta',
    value: '2.3min',
    change: '-0.5min',
    changeType: 'positive' as const,
    icon: Clock,
    color: 'purple'
  }
];

export function MetricsGrid({ account }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                metric.color === 'blue' ? 'bg-blue-100' :
                metric.color === 'green' ? 'bg-green-100' :
                metric.color === 'orange' ? 'bg-orange-100' :
                'bg-purple-100'
              }`}>
                <Icon className={`h-6 w-6 ${
                  metric.color === 'blue' ? 'text-blue-600' :
                  metric.color === 'green' ? 'text-green-600' :
                  metric.color === 'orange' ? 'text-orange-600' :
                  'text-purple-600'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change}
              </span>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}