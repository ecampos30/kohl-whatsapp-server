import React, { useState } from 'react';
import { Plus, Play, Pause, Edit3, Trash2 } from 'lucide-react';
import { WhatsAppAccount, Campaign } from '../../types/accounts';
import { CreateCampaignModal } from './CreateCampaignModal';
import { mockCampaigns } from '../../data/mockData';

interface FlowBuilderProps {
  account: WhatsAppAccount;
}

export function FlowBuilder({ account }: FlowBuilderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [campaigns] = useState<Campaign[]>(
    mockCampaigns.filter(c => c.accountId === account.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxos & Campanhas</h1>
          <p className="text-gray-600">Gerencie automações para {account.name}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Fluxo</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Campanhas Ativas</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status === 'active' ? 'Ativo' :
                       campaign.status === 'paused' ? 'Pausado' : 'Finalizado'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                    <span>📅 {campaign.schedule.time}</span>
                    <span>📊 {campaign.metrics.sent} enviadas</span>
                    <span>📖 {campaign.metrics.read} lidas</span>
                    <span>🎯 {campaign.metrics.clicked} cliques</span>
                  </div>
                  
                  <p className="text-sm text-gray-700">{campaign.content.text?.substring(0, 100)}...</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600 transition-colors">
                    {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateCampaignModal 
          account={account}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}