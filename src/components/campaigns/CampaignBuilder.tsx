import React, { useState } from 'react';
import { Plus, Play, Pause, Edit3, Trash2, Calendar, Users, Image, Video, FileText, List, BarChart3 } from 'lucide-react';
import { Campaign, CampaignMessage, WhatsAppNumber, Lead } from '../../types/system';

interface CampaignBuilderProps {
  number: WhatsAppNumber;
  campaigns: Campaign[];
  leads: Lead[];
  onSave: (campaigns: Campaign[]) => void;
}

export function CampaignBuilder({ number, campaigns, leads, onSave }: CampaignBuilderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const numberCampaigns = campaigns.filter(c => c.number_id === number.id);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800';
      case 'pausada': return 'bg-yellow-100 text-yellow-800';
      case 'rascunho': return 'bg-gray-100 text-gray-800';
      case 'finalizada': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleCampaignStatus = (id: string) => {
    const updatedCampaigns = campaigns.map(campaign => {
      if (campaign.id === id) {
        return {
          ...campaign,
          status: campaign.status === 'ativa' ? 'pausada' : 'ativa' as Campaign['status']
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
          <h2 className="text-xl font-semibold text-gray-900">Campanhas & Fluxos</h2>
          <p className="text-gray-600">Gerencie campanhas para {number.name} ({number.phone})</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Campanha</span>
        </button>
      </div>

      {numberCampaigns.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
          {numberCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status === 'ativa' ? 'Ativa' :
                       campaign.status === 'pausada' ? 'Pausada' :
                       campaign.status === 'rascunho' ? 'Rascunho' : 'Finalizada'}
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
                    {campaign.status === 'ativa' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
                    <span>{new Date(campaign.schedule.start_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{campaign.targeting.tags.length} segmentos</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {campaign.messages.length} mensagem(ns)
                    </span>
                    {campaign.messages.length > 1 && (
                      <span className="text-xs text-gray-500">
                        com intervalos de {campaign.schedule.intervals.join(', ')} min
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {campaign.messages[0]?.content.text || 'Nenhuma prévia de conteúdo disponível'}
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
          number={number}
          leads={leads}
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
          number={number}
          leads={leads}
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

// Modal para criar campanha
function CampaignCreateModal({ 
  number,
  leads,
  onClose, 
  onSave 
}: { 
  number: WhatsAppNumber;
  leads: Lead[];
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    type: 'broadcast' as Campaign['type'],
    schedule: {
      start_date: new Date().toISOString().split('T')[0],
      timezone: 'America/Sao_Paulo',
      intervals: [0] // Primeira mensagem imediata
    },
    messages: [{
      id: '1',
      order: 1,
      type: 'text' as const,
      content: {
        text: ''
      },
      variables: {}
    }] as CampaignMessage[],
    targeting: {
      tags: [] as string[],
      stages: [] as string[],
      cities: [] as string[]
    }
  });

  const availableTags = [...new Set(leads.flatMap(lead => lead.tags))];
  const availableCities = [...new Set(leads.map(lead => lead.city).filter(Boolean))];

  const addMessage = () => {
    const newMessage: CampaignMessage = {
      id: Date.now().toString(),
      order: formData.messages.length + 1,
      type: 'text',
      content: { text: '' },
      variables: {}
    };
    
    setFormData({
      ...formData,
      messages: [...formData.messages, newMessage],
      schedule: {
        ...formData.schedule,
        intervals: [...formData.schedule.intervals, 60] // 1 hora de intervalo padrão
      }
    });
  };

  const updateMessage = (index: number, updates: Partial<CampaignMessage>) => {
    const newMessages = [...formData.messages];
    newMessages[index] = { ...newMessages[index], ...updates };
    setFormData({ ...formData, messages: newMessages });
  };

  const removeMessage = (index: number) => {
    if (formData.messages.length === 1) return; // Manter pelo menos uma mensagem
    
    const newMessages = formData.messages.filter((_, i) => i !== index);
    const newIntervals = formData.schedule.intervals.filter((_, i) => i !== index);
    
    setFormData({
      ...formData,
      messages: newMessages,
      schedule: { ...formData.schedule, intervals: newIntervals }
    });
  };

  const handleSubmit = () => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      account_id: '', // Será preenchido pelo contexto
      number_id: number.id,
      name: formData.name,
      type: formData.type,
      status: 'rascunho',
      messages: formData.messages,
      targeting: formData.targeting,
      schedule: formData.schedule,
      metrics: {
        sent: 0,
        delivered: 0,
        read: 0,
        clicked: 0,
        replied: 0,
        opt_outs: 0
      },
      created_at: new Date().toISOString(),
      created_by: '' // Será preenchido pelo contexto do usuário
    };
    
    onSave(newCampaign);
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'list': return <List className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Criar Nova Campanha</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        {/* Steps */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Informações</span>
            <span className="text-xs text-gray-600">Mensagens</span>
            <span className="text-xs text-gray-600">Segmentação</span>
          </div>
        </div>

        {/* Step 1: Informações */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Boas-vindas Nanoblading"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Campanha
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as Campaign['type']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="broadcast">Transmissão (envio único)</option>
                  <option value="sequence">Sequência (múltiplas mensagens)</option>
                  <option value="trigger">Gatilho (baseado em ação)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={formData.schedule.start_date}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {...formData.schedule, start_date: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 2: Mensagens */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Mensagens da Campanha</h3>
              <button
                onClick={addMessage}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {formData.messages.map((message, index) => (
                <div key={message.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">
                        Mensagem {index + 1}
                      </span>
                      {index > 0 && (
                        <span className="text-xs text-gray-500">
                          (após {formData.schedule.intervals[index]} min)
                        </span>
                      )}
                    </div>
                    
                    {formData.messages.length > 1 && (
                      <button
                        onClick={() => removeMessage(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={message.type}
                        onChange={(e) => updateMessage(index, { type: e.target.value as any })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="text">Texto</option>
                        <option value="image">Imagem</option>
                        <option value="video">Vídeo</option>
                        <option value="document">Documento</option>
                        <option value="list">Lista</option>
                      </select>
                    </div>

                    {index > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Intervalo (min)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.schedule.intervals[index]}
                          onChange={(e) => {
                            const newIntervals = [...formData.schedule.intervals];
                            newIntervals[index] = parseInt(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              schedule: { ...formData.schedule, intervals: newIntervals }
                            });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {message.type !== 'text' && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        URL da Mídia
                      </label>
                      <input
                        type="url"
                        value={message.content.media_url || ''}
                        onChange={(e) => updateMessage(index, {
                          content: { ...message.content, media_url: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://exemplo.com/arquivo.jpg"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Texto da Mensagem
                    </label>
                    <textarea
                      value={message.content.text || ''}
                      onChange={(e) => updateMessage(index, {
                        content: { ...message.content, text: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Olá {{first_name}}! Bem-vindo(a) ao curso de..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use variáveis: {'{{'} first_name {'}}'}, {'{{'} name {'}}'}, {'{{'} city {'}}'}, {'{{'} email {'}}'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Segmentação */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Segmentação da Audiência</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {availableTags.map((tag) => (
                      <label key={tag} className="flex items-center mb-1">
                        <input
                          type="checkbox"
                          checked={formData.targeting.tags.includes(tag)}
                          onChange={(e) => {
                            const newTags = e.target.checked
                              ? [...formData.targeting.tags, tag]
                              : formData.targeting.tags.filter(t => t !== tag);
                            setFormData({
                              ...formData,
                              targeting: { ...formData.targeting, tags: newTags }
                            });
                          }}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm text-gray-700">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estágios do Funil
                  </label>
                  <div className="space-y-2">
                    {['novo', 'qualificando', 'oportunidade', 'cliente'].map((stage) => (
                      <label key={stage} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.targeting.stages.includes(stage)}
                          onChange={(e) => {
                            const newStages = e.target.checked
                              ? [...formData.targeting.stages, stage]
                              : formData.targeting.stages.filter(s => s !== stage);
                            setFormData({
                              ...formData,
                              targeting: { ...formData.targeting, stages: newStages }
                            });
                          }}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm text-gray-700 capitalize">{stage}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {availableCities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidades
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {availableCities.map((city) => (
                      <label key={city} className="flex items-center mb-1">
                        <input
                          type="checkbox"
                          checked={formData.targeting.cities?.includes(city) || false}
                          onChange={(e) => {
                            const newCities = e.target.checked
                              ? [...(formData.targeting.cities || []), city]
                              : (formData.targeting.cities || []).filter(c => c !== city);
                            setFormData({
                              ...formData,
                              targeting: { ...formData.targeting, cities: newCities }
                            });
                          }}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm text-gray-700">{city}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Prévia da Audiência</h4>
              <p className="text-sm text-blue-800">
                Esta campanha será enviada para aproximadamente{' '}
                <strong>
                  {leads.filter(lead => {
                    const matchesTags = formData.targeting.tags.length === 0 || 
                      formData.targeting.tags.some(tag => lead.tags.includes(tag));
                    const matchesStages = formData.targeting.stages.length === 0 || 
                      formData.targeting.stages.includes(lead.stage);
                    const matchesCities = !formData.targeting.cities?.length || 
                      formData.targeting.cities.includes(lead.city || '');
                    
                    return matchesTags && matchesStages && matchesCities;
                  }).length}
                </strong>{' '}
                leads.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          
          <button
            onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleSubmit()}
            disabled={
              (currentStep === 1 && !formData.name) ||
              (currentStep === 2 && formData.messages.some(m => !m.content.text))
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === 3 ? 'Criar Campanha' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal para editar campanha (similar ao create, mas com dados preenchidos)
function CampaignEditModal({ 
  campaign,
  number,
  leads,
  onClose, 
  onSave 
}: { 
  campaign: Campaign;
  number: WhatsAppNumber;
  leads: Lead[];
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Editar Campanha</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <p className="text-gray-600">Interface de edição de campanha seria implementada aqui...</p>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900">
            Cancelar
          </button>
          <button 
            onClick={() => onSave(campaign)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}