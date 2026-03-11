import React, { useState } from 'react';
import { Plus, Play, Pause, CreditCard as Edit3, Trash2, Calendar, Users, MessageSquare, X } from 'lucide-react';
import { Campaign, WhatsAppConnection } from '../../types/kohl-system';

interface CampaignManagerProps {
  campaigns: Campaign[];
  connections: WhatsAppConnection[];
  onSave: (campaigns: Campaign[]) => void;
}

const STATUS_STYLES: Record<Campaign['status'], string> = {
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  paused:    'bg-amber-50 text-amber-700 border border-amber-200',
  draft:     'bg-gray-100 text-gray-600 border border-gray-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
};

const STATUS_LABELS: Record<Campaign['status'], string> = {
  active: 'Ativo', paused: 'Pausado', draft: 'Rascunho', completed: 'Finalizado',
};

const TYPE_LABELS: Record<Campaign['type'], string> = {
  broadcast: 'Transmissao', sequence: 'Sequencia', trigger: 'Gatilho',
};

export function CampaignManager({ campaigns, connections, onSave }: CampaignManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const toggleCampaignStatus = (id: string) => {
    onSave(campaigns.map(c =>
      c.id === id
        ? { ...c, status: c.status === 'active' ? 'paused' : 'active' as Campaign['status'] }
        : c
    ));
  };

  const deleteCampaign = (id: string) => {
    onSave(campaigns.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Campanhas e Fluxos</h2>
          <p className="text-sm text-gray-500 mt-0.5">Crie e gerencie campanhas de mensagens automatizadas</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Campanha
        </button>
      </div>

      {/* Empty state */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 px-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Nenhuma campanha ainda</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            Crie sua primeira campanha automatizada para engajar com seus leads
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors mx-auto"
          >
            <Plus className="h-4 w-4" />
            Criar Campanha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
              {/* Card header */}
              <div className="flex items-start justify-between p-5 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[campaign.status]}`}>
                      {STATUS_LABELS[campaign.status]}
                    </span>
                    <span className="text-xs text-gray-400">{TYPE_LABELS[campaign.type]}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{campaign.name}</h3>
                </div>
                <div className="flex items-center gap-0.5 ml-3 shrink-0">
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleCampaignStatus(campaign.id)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title={campaign.status === 'active' ? 'Pausar' : 'Ativar'}
                  >
                    {campaign.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 pb-5 space-y-3">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {campaign.schedule.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {campaign.targeting.segments.length} segmentos
                  </span>
                </div>

                {campaign.content[0]?.content.text && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {campaign.content[0].content.text}
                    </p>
                  </div>
                )}

                {/* Metrics row */}
                <div className="grid grid-cols-4 gap-0 border border-gray-100 rounded-lg overflow-hidden">
                  {[
                    { label: 'Enviadas', value: campaign.metrics.sent, color: 'text-gray-900' },
                    { label: 'Entregues', value: campaign.metrics.delivered, color: 'text-blue-600' },
                    { label: 'Lidas', value: campaign.metrics.read, color: 'text-emerald-600' },
                    { label: 'Respostas', value: campaign.metrics.replied, color: 'text-rose-600' },
                  ].map((m, i) => (
                    <div key={m.label} className={`py-2.5 text-center ${i < 3 ? 'border-r border-gray-100' : ''}`}>
                      <div className={`text-base font-semibold ${m.color}`}>{m.value}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{m.label}</div>
                    </div>
                  ))}
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
            onSave(campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
            setSelectedCampaign(null);
          }}
        />
      )}
    </div>
  );
}

function CampaignCreateModal({
  connections,
  onClose,
  onSave,
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
      frequency: 'once' as const,
    },
    content: [{ id: '1', order: 1, content: { type: 'text' as const, text: '' } }],
    targeting: { segments: ['all'], tags: [] },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: Date.now().toString(),
      name: formData.name,
      whatsappId: formData.whatsappId,
      status: 'draft',
      type: formData.type,
      schedule: { ...formData.schedule, timezone: 'America/Sao_Paulo' },
      targeting: formData.targeting,
      content: formData.content,
      metrics: { sent: 0, delivered: 0, read: 0, replied: 0, clicked: 0, converted: 0 },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Nova Campanha</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome da Campanha</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="ex: Boas-vindas Novos Alunos"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Numero WhatsApp</label>
              <select
                value={formData.whatsappId}
                onChange={(e) => setFormData({ ...formData, whatsappId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>{conn.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Campaign['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="broadcast">Transmissao</option>
                <option value="sequence">Sequencia</option>
                <option value="trigger">Gatilho</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-700">Conteudo da Mensagem</label>
              <span className={`text-xs tabular-nums ${formData.content[0].content.text.length > 900 ? 'text-red-500' : 'text-gray-400'}`}>
                {formData.content[0].content.text.length}/1024
              </span>
            </div>
            <textarea
              required
              value={formData.content[0].content.text}
              onChange={(e) => setFormData({
                ...formData,
                content: [{ ...formData.content[0], content: { ...formData.content[0].content, text: e.target.value } }],
              })}
              rows={5}
              maxLength={1024}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              placeholder="Ola {{nome}}! Bem-vindo aos Cursos Kohl Beauty..."
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Use <code className="bg-gray-100 px-1 rounded">{'{{nome}}'}</code> para personalizar com o nome do contato
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Data de Envio</label>
              <input
                type="date"
                value={formData.schedule.startDate}
                onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, startDate: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Horario</label>
              <input
                type="time"
                value={formData.schedule.time}
                onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, time: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors">
              Criar Campanha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CampaignEditModal({
  campaign,
  connections,
  onClose,
  onSave,
}: {
  campaign: Campaign;
  connections: WhatsAppConnection[];
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Editar Campanha</h2>
            <p className="text-xs text-gray-500 mt-0.5">{campaign.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-5 text-center border border-dashed border-gray-200">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Edicao completa em breve</p>
            <p className="text-xs text-gray-400">O editor completo da campanha estara disponivel em uma proxima versao.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
