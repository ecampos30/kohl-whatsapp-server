import React, { useState } from 'react';
import { Plus, Play, Pause, Edit3, Trash2, Calendar, Users, MessageSquare } from 'lucide-react';
import { Campaign, WhatsAppConnection } from '../../types/kohl-system';

interface CampaignManagerProps {
  campaigns: Campaign[];
  connections: WhatsAppConnection[];
  onSave: (campaigns: Campaign[]) => void;
}

export function CampaignManager({ campaigns, connections, onSave }: CampaignManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleCampaignStatus = (id: string) => {
    const updatedCampaigns = campaigns.map(campaign => {
      if (campaign.id === id) {
        return {
          ...campaign,
          status: campaign.status === 'active' ? 'paused' : 'active' as Campaign['status']
        };
      }
      return campaign;
    });
    onSave(updatedCampaigns);
  };

  const deleteCampaign = (id: string) => {
    const updatedCampaigns = campaigns.filter(campaign => campaign.id !== id);
    onSave(updatedCampaigns);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gerenciador de Campanhas</h2>
          <p className="text-gray-600">Crie e gerencie campanhas de mensagens automatizadas</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Campanha</span>
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma campanha ainda</h3>
          <p className="text-gray-600 mb-6">Crie sua primeira campanha automatizada para engajar com seus leads</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Criar Campanha</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status === 'active' ? 'Ativo' :
                       campaign.status === 'paused' ? 'Pausado' :
                       campaign.status === 'draft' ? 'Rascunho' : 'Finalizado'}
                    </span>
                    <span className="text-sm text-gray-600 capitalize">
                      {campaign.type === 'broadcast' ? 'Transmissão' :
                       campaign.type === 'sequence' ? 'Sequência' : 'Gatilho'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleCampaignStatus(campaign.id)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  >
                    {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{campaign.schedule.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{campaign.targeting.segments.length} segmentos</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {campaign.content[0]?.content.text || 'Nenhuma prévia de conteúdo disponível'}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{campaign.metrics.sent}</div>
                    <div className="text-xs text-gray-600">Enviadas</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{campaign.metrics.delivered}</div>
                    <div className="text-xs text-gray-600">Entregues</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{campaign.metrics.read}</div>
                    <div className="text-xs text-gray-600">Lidas</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-purple-600">{campaign.metrics.replied}</div>
                    <div className="text-xs text-gray-600">Respondidas</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CampaignCreateModal
          connections={connections}
          onClose={() => setShowCreateModal(false)}
          onSave={(campaign) => {
            onSave([...campaigns, campaign]);
            setShowCreateModal(false);
          }}
        />
      )}

      {selectedCampaign && (
        <CampaignEditModal
          campaign={selectedCampaign}
          connections={connections}
          onClose={() => setSelectedCampaign(null)}
          onSave={(updatedCampaign) => {
            const updatedCampaigns = campaigns.map(c => 
              c.id === updatedCampaign.id ? updatedCampaign : c
            );
            onSave(updatedCampaigns);
            setSelectedCampaign(null);
          }}
        />
      )}
    </div>
  );
}

// Campaign Create Modal Component
function CampaignCreateModal({ 
  connections, 
  onClose, 
  onSave 
}: { 
  connections: WhatsAppConnection[];
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    whatsappId: connections[0]?.id || '',
    type: 'broadcast' as Campaign['type'],
    schedule: {
      startDate: new Date().toISOString().split('T')[0],
      time: '09:00',
      frequency: 'once' as const
    },
    content: [{
      id: '1',
      order: 1,
      content: {
        type: 'text' as const,
        text: ''
      }
    }],
    targeting: {
      segments: ['all'],
      tags: []
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: formData.name,
      whatsappId: formData.whatsappId,
      status: 'draft',
      type: formData.type,
      schedule: {
        ...formData.schedule,
        timezone: 'America/Sao_Paulo'
      },
      targeting: formData.targeting,
      content: formData.content,
      metrics: {
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
        clicked: 0,
        converted: 0
      }
    };
    
    onSave(newCampaign);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Campaign</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Welcome New Students"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <select
                value={formData.whatsappId}
                onChange={(e) => setFormData({...formData, whatsappId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.number})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Content
            </label>
            <textarea
              required
              value={formData.content[0].content.text}
              onChange={(e) => setFormData({
                ...formData,
                content: [{
                  ...formData.content[0],
                  content: { ...formData.content[0].content, text: e.target.value }
                }]
              })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Hello {{name}}! Welcome to Kohl Beauty Courses..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send Date
              </label>
              <input
                type="date"
                value={formData.schedule.startDate}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {...formData.schedule, startDate: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send Time
              </label>
              <input
                type="time"
                value={formData.schedule.time}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {...formData.schedule, time: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Campaign Edit Modal Component (simplified for brevity)
function CampaignEditModal({ 
  campaign, 
  connections, 
  onClose, 
  onSave 
}: { 
  campaign: Campaign;
  connections: WhatsAppConnection[];
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Campaign</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <p className="text-gray-600">Campaign editing interface would go here...</p>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button 
            onClick={() => onSave(campaign)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}