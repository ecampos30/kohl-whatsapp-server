import React, { useState } from 'react';
import { Search, Filter, Plus, Star, MessageCircle, Calendar, MapPin, Phone, Mail, Tag } from 'lucide-react';
import { Lead, WhatsAppNumber, LeadFilters } from '../../types/system';

interface LeadManagerProps {
  number: WhatsAppNumber;
  leads: Lead[];
  onSave: (leads: Lead[]) => void;
}

export function LeadManager({ number, leads, onSave }: LeadManagerProps) {
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<LeadFilters>({});

  const numberLeads = leads.filter(l => l.number_id === number.id);

  const stages = [
    { id: 'novo', label: 'Novos', color: 'blue' },
    { id: 'qualificando', label: 'Qualificando', color: 'yellow' },
    { id: 'oportunidade', label: 'Oportunidade', color: 'orange' },
    { id: 'cliente', label: 'Clientes', color: 'green' },
    { id: 'perdido', label: 'Perdidos', color: 'red' }
  ];

  const filteredLeads = numberLeads.filter(lead => {
    if (filters.search && !lead.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !lead.whatsapp.includes(filters.search)) {
      return false;
    }
    if (filters.tags?.length && !filters.tags.some(tag => lead.tags.includes(tag))) {
      return false;
    }
    if (filters.stages?.length && !filters.stages.includes(lead.stage)) {
      return false;
    }
    if (filters.cities?.length && !filters.cities.includes(lead.city || '')) {
      return false;
    }
    if (filters.score_range && (lead.score < filters.score_range.min || lead.score > filters.score_range.max)) {
      return false;
    }
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStageColor = (stage: string) => {
    const stageConfig = stages.find(s => s.id === stage);
    const color = stageConfig?.color || 'gray';
    return `bg-${color}-100 text-${color}-800`;
  };

  const updateLeadStage = (leadId: string, newStage: string) => {
    const updatedLeads = leads.map(lead => 
      lead.id === leadId 
        ? { ...lead, stage: newStage as Lead['stage'], last_interaction: new Date().toISOString() }
        : lead
    );
    onSave(updatedLeads);
  };

  const addLead = (newLead: Omit<Lead, 'id' | 'created_at' | 'last_interaction' | 'interactions'>) => {
    const lead: Lead = {
      ...newLead,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      last_interaction: new Date().toISOString(),
      interactions: []
    };
    onSave([...leads, lead]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestão de Leads</h2>
          <p className="text-gray-600">Gerencie leads para {number.name} ({number.phone})</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setView(view === 'list' ? 'kanban' : 'list')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
          >
            {view === 'list' ? 'Visualização Kanban' : 'Visualização Lista'}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou WhatsApp..."
              value={filters.search || ''}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filters.stages?.[0] || ''}
              onChange={(e) => setFilters({
                ...filters, 
                stages: e.target.value ? [e.target.value] : undefined
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os estágios</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const count = numberLeads.filter(lead => lead.stage === stage.id).length;
          return (
            <div key={stage.id} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{stage.label}</div>
            </div>
          );
        })}
      </div>

      {/* Lista/Kanban de Leads */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead encontrado</h3>
          <p className="text-gray-600 mb-6">
            {filters.search || filters.tags?.length || filters.stages?.length
              ? 'Tente ajustar os filtros de busca'
              : 'Comece adicionando seu primeiro lead ou conecte o WhatsApp para receber leads automaticamente'
            }
          </p>
          {!filters.search && !filters.tags?.length && !filters.stages?.length && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Adicionar Primeiro Lead</span>
            </button>
          )}
        </div>
      ) : view === 'kanban' ? (
        <LeadKanban 
          leads={filteredLeads} 
          stages={stages}
          onUpdateStage={updateLeadStage}
          onQualify={(lead) => setShowQualificationModal(lead)}
        />
      ) : (
        <LeadList 
          leads={filteredLeads}
          onQualify={(lead) => setShowQualificationModal(lead)}
        />
      )}

      {/* Modais */}
      {showAddModal && (
        <AddLeadModal
          number={number}
          onClose={() => setShowAddModal(false)}
          onSave={(lead) => {
            addLead(lead);
            setShowAddModal(false);
          }}
        />
      )}

      {showQualificationModal && (
        <QualificationModal
          lead={showQualificationModal}
          onClose={() => setShowQualificationModal(null)}
          onSave={(updatedLead) => {
            const updatedLeads = leads.map(l => l.id === updatedLead.id ? updatedLead : l);
            onSave(updatedLeads);
            setShowQualificationModal(null);
          }}
        />
      )}
    </div>
  );
}

// Componente Kanban
function LeadKanban({ 
  leads, 
  stages, 
  onUpdateStage, 
  onQualify 
}: { 
  leads: Lead[];
  stages: any[];
  onUpdateStage: (leadId: string, stage: string) => void;
  onQualify: (lead: Lead) => void;
}) {
  const getLeadsByStage = (stage: string) => 
    leads.filter(lead => lead.stage === stage);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id);
        
        return (
          <div key={stage.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{stage.label}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                stage.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                stage.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                stage.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                stage.color === 'green' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {stageLeads.length}
              </span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stageLeads.map((lead) => (
                <div 
                  key={lead.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onQualify(lead)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{lead.name || 'Nome não informado'}</h4>
                      <p className="text-sm text-gray-600">{lead.whatsapp}</p>
                      {lead.email && <p className="text-xs text-gray-500">{lead.email}</p>}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(lead.score)}`}>
                      {lead.score}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {lead.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {lead.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{lead.tags.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(lead.last_interaction).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{lead.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente Lista
function LeadList({ 
  leads, 
  onQualify 
}: { 
  leads: Lead[];
  onQualify: (lead: Lead) => void;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'novo': return 'bg-blue-100 text-blue-800';
      case 'qualificando': return 'bg-yellow-100 text-yellow-800';
      case 'oportunidade': return 'bg-orange-100 text-orange-800';
      case 'cliente': return 'bg-green-100 text-green-800';
      case 'perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <div key={lead.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{lead.name || 'Nome não informado'}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>{lead.whatsapp}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{lead.email}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(lead.score)}`}>
                <Star className="h-3 w-3 inline mr-1" />
                {lead.score}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
                {lead.stage}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
            {lead.city && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{lead.city}, {lead.state}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Último contato: {new Date(lead.last_interaction).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Tag className="h-4 w-4" />
              <span>Origem: {lead.source}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {lead.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
          
          {lead.notes && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">{lead.notes}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Criado em: {new Date(lead.created_at).toLocaleDateString('pt-BR')}
            </div>
            
            <button
              onClick={() => onQualify(lead)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Qualificar Lead
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Modal para adicionar lead
function AddLeadModal({ 
  number,
  onClose, 
  onSave 
}: { 
  number: WhatsAppNumber;
  onClose: () => void;
  onSave: (lead: Omit<Lead, 'id' | 'created_at' | 'last_interaction' | 'interactions'>) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    city: '',
    state: '',
    source: 'site',
    tags: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.whatsapp) {
      alert('WhatsApp é obrigatório');
      return;
    }

    const newLead = {
      account_id: '', // Será preenchido pelo contexto
      number_id: number.id,
      whatsapp: formData.whatsapp,
      name: formData.name || undefined,
      first_name: formData.name ? formData.name.split(' ')[0] : undefined,
      email: formData.email || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      stage: 'novo' as const,
      score: 50, // Score padrão
      source: formData.source,
      notes: formData.notes,
      opt_in: {
        date: new Date().toISOString(),
        source: 'manual_add'
      }
    };
    
    onSave(newLead);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Adicionar Novo Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Maria Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="maria@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origem
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="site">Site</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="indicacao">Indicação</option>
                <option value="anuncio">Anúncio</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="São Paulo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SP"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="nanoblading, lead-quente, presencial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações sobre este lead..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Adicionar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de qualificação
function QualificationModal({ 
  lead, 
  onClose, 
  onSave 
}: { 
  lead: Lead;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}) {
  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    objetivo: lead.qualification?.objetivo || '',
    orcamento: lead.qualification?.orcamento || 'medio',
    cidade: lead.qualification?.cidade || lead.city || '',
    modalidade: lead.qualification?.modalidade || 'presencial',
    urgencia: lead.qualification?.urgencia || 2,
    experiencia: lead.qualification?.experiencia || 'iniciante',
    notes: lead.notes
  });

  const calculateScore = () => {
    let score = 0;
    
    // Orçamento (30 pontos)
    if (formData.orcamento === 'alto') score += 30;
    else if (formData.orcamento === 'medio') score += 20;
    else score += 10;
    
    // Urgência (25 pontos)
    score += formData.urgencia * 8;
    
    // Objetivo claro (20 pontos)
    if (formData.objetivo.length > 20) score += 20;
    else if (formData.objetivo.length > 10) score += 10;
    
    // Experiência (15 pontos)
    if (formData.experiencia === 'avancado') score += 15;
    else if (formData.experiencia === 'intermediario') score += 10;
    else score += 5;
    
    // Dados completos (10 pontos)
    if (formData.name && formData.email) score += 10;
    
    return Math.min(score, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const score = calculateScore();
    const updatedLead: Lead = {
      ...lead,
      name: formData.name || undefined,
      email: formData.email || undefined,
      city: formData.cidade || undefined,
      score,
      stage: score >= 70 ? 'oportunidade' : score >= 40 ? 'qualificando' : 'novo',
      qualification: {
        objetivo: formData.objetivo,
        orcamento: formData.orcamento as any,
        cidade: formData.cidade,
        modalidade: formData.modalidade as any,
        urgencia: formData.urgencia as any,
        experiencia: formData.experiencia as any
      },
      notes: formData.notes,
      last_interaction: new Date().toISOString()
    };
    
    onSave(updatedLead);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Qualificar Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do lead"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objetivo / Interesse Principal
            </label>
            <textarea
              value={formData.objetivo}
              onChange={(e) => setFormData({...formData, objetivo: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva o interesse ou objetivo do lead..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Estimado
              </label>
              <select
                value={formData.orcamento}
                onChange={(e) => setFormData({...formData, orcamento: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="baixo">Até R$ 500</option>
                <option value="medio">R$ 500 - R$ 2.000</option>
                <option value="alto">Acima de R$ 2.000</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgência (1-3)
              </label>
              <select
                value={formData.urgencia}
                onChange={(e) => setFormData({...formData, urgencia: parseInt(e.target.value) as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 - Baixa</option>
                <option value={2}>2 - Média</option>
                <option value={3}>3 - Alta</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experiência
              </label>
              <select
                value={formData.experiencia}
                onChange={(e) => setFormData({...formData, experiencia: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="São Paulo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidade Preferida
              </label>
              <select
                value={formData.modalidade}
                onChange={(e) => setFormData({...formData, modalidade: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações Adicionais
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações importantes sobre o lead..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Pré-visualização do Score</h3>
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-blue-600">{calculateScore()}</div>
              <div className="text-sm text-blue-700">
                {calculateScore() >= 70 ? '🔥 Lead Quente' : 
                 calculateScore() >= 40 ? '🟡 Lead Morno' : '❄️ Lead Frio'}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Salvar Qualificação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}