import React from 'react';
import { TrendingUp, Eye, MousePointer, MessageSquare } from 'lucide-react';

export function CampaignPerformance() {
  const campaigns = [
    {
      name: 'Oferta Black Friday',
      sent: 1250,
      delivered: 1198,
      read: 856,
      clicked: 234,
      replied: 89,
      ctr: 27.3
    },
    {
      name: 'Curso Programação',
      sent: 800,
      delivered: 785,
      read: 612,
      clicked: 145,
      replied: 67,
      ctr: 23.7
    },
    {
      name: 'Lembrete Webinar',
      sent: 450,
      delivered: 445,
      read: 389,
      clicked: 156,
      replied: 23,
      ctr: 40.1
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-6">Performance de Campanhas</h3>
      
      <div className="space-y-4">
        {campaigns.map((campaign, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{campaign.name}</h4>
              <span className="text-sm font-medium text-green-600">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                {campaign.ctr}% CTR
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                  <Eye className="h-3 w-3" />
                  <span className="text-xs">Entregas</span>
                </div>
                <div className="font-semibold text-gray-900">{campaign.delivered.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{((campaign.delivered/campaign.sent)*100).toFixed(1)}%</div>
              </div>
              
              <div>
                <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                  <MessageSquare className="h-3 w-3" />
                  <span className="text-xs">Leituras</span>
                </div>
                <div className="font-semibold text-blue-900">{campaign.read.toLocaleString()}</div>
                <div className="text-xs text-blue-600">{((campaign.read/campaign.delivered)*100).toFixed(1)}%</div>
              </div>
              
              <div>
                <div className="flex items-center justify-center space-x-1 text-orange-600 mb-1">
                  <MousePointer className="h-3 w-3" />
                  <span className="text-xs">Cliques</span>
                </div>
                <div className="font-semibold text-orange-900">{campaign.clicked.toLocaleString()}</div>
                <div className="text-xs text-orange-600">{((campaign.clicked/campaign.read)*100).toFixed(1)}%</div>
              </div>
              
              <div>
                <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                  <MessageSquare className="h-3 w-3" />
                  <span className="text-xs">Respostas</span>
                </div>
                <div className="font-semibold text-green-900">{campaign.replied.toLocaleString()}</div>
                <div className="text-xs text-green-600">{((campaign.replied/campaign.read)*100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}