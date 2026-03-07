import React from 'react';
import { WhatsAppAccount } from '../../types/accounts';

interface LeadFunnelProps {
  account: WhatsAppAccount;
}

const funnelData = [
  { stage: 'Novos', count: 45, color: 'blue' },
  { stage: 'Qualificando', count: 32, color: 'yellow' },
  { stage: 'Oportunidade', count: 18, color: 'orange' },
  { stage: 'Cliente', count: 12, color: 'green' },
];

export function LeadFunnel({ account }: LeadFunnelProps) {
  const total = funnelData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Funil de Leads</h2>
      
      <div className="space-y-4">
        {funnelData.map((item, index) => {
          const percentage = (item.count / total) * 100;
          
          return (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{item.stage}</span>
                <span className="text-sm text-gray-600">{item.count} leads</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    item.color === 'blue' ? 'bg-blue-600' :
                    item.color === 'yellow' ? 'bg-yellow-500' :
                    item.color === 'orange' ? 'bg-orange-500' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                {percentage.toFixed(1)}% do total
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-600">Total de leads ativos</div>
        </div>
      </div>
    </div>
  );
}