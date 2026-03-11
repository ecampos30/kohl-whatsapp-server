import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Star, MessageCircle, Calendar, MapPin, Bot, UserCheck, Loader2, Activity, Globe, Tag, Megaphone, MousePointerClick, ChevronDown, ChevronUp } from 'lucide-react';
import { Lead, WhatsAppConnection, LeadTracking, LeadEntryChannel } from '../../types/kohl-system';
import {
  HandoffMap,
  HandoffEntry,
  getHandoffMap,
  pauseContact,
  resumeContact,
  isContactPausedInMap,
  getExpiryLabel,
} from '../../services/handoffService';
import { LeadMonitorBadge, MonitorAlertList } from './LeadMonitorBadge';
import { supabase } from '../../lib/supabase';
import {
  getTrackingFromSession,
  entryChannelLabel,
  trackingToSourceLabel,
} from '../../services/leadTrackingService';

interface LeadManagerProps {
  leads: Lead[];
  connections: WhatsAppConnection[];
  onSave: (leads: Lead[]) => void;
}

function useHandoff(connections: WhatsAppConnection[]) {
  const [handoffMap, setHandoffMap] = useState<HandoffMap>({});
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loadingJid, setLoadingJid] = useState<string | null>(null);

  const resolveConnection = useCallback(async () => {
    if (connections.length > 0) {
      const conn = connections[0];
      setConnectionId(conn.id);
      const { data } = await supabase
        .from('whatsapp_connections')
        .select('client_id')
        .eq('id', conn.id)
        .maybeSingle();
      setClientId(data?.client_id ?? null);
      return { connectionId: conn.id, clientId: data?.client_id ?? null };
    }
    const { data } = await supabase
      .from('whatsapp_connections')
      .select('id, client_id')
      .limit(1)
      .maybeSingle();
    if (data) {
      setConnectionId(data.id);
      setClientId(data.client_id);
      return { connectionId: data.id, clientId: data.client_id };
    }
    return { connectionId: null, clientId: null };
  }, [connections]);

  const refresh = useCallback(async (cid?: string) => {
    const id = cid ?? connectionId;
    if (!id) return;
    const map = await getHandoffMap(id);
    setHandoffMap(map);
  }, [connectionId]);

  useEffect(() => {
    resolveConnection().then(({ connectionId: cid }) => {
      if (cid) refresh(cid);
    });
  }, [resolveConnection, refresh]);

  const getLeadEntry = useCallback((phone: string): HandoffEntry | null => {
    const jid = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
    return handoffMap[jid] ?? handoffMap[phone] ?? null;
  }, [handoffMap]);

  const isLeadPaused = useCallback((phone: string): boolean => {
    const jid = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
    return isContactPausedInMap(handoffMap, jid) || isContactPausedInMap(handoffMap, phone);
  }, [handoffMap]);

  const pause = useCallback(async (phone: string) => {
    let cid = connectionId;
    let clt = clientId;
    if (!cid || !clt) {
      const resolved = await resolveConnection();
      cid = resolved.connectionId;
      clt = resolved.clientId;
    }
    if (!cid || !clt) return;
    const jid = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
    setLoadingJid(jid);
    await pauseContact(cid, clt, jid, 'panel');
    await refresh(cid);
    setLoadingJid(null);
  }, [connectionId, clientId, resolveConnection, refresh]);

  const resume = useCallback(async (phone: string) => {
    let cid = connectionId;
    let clt = clientId;
    if (!cid || !clt) {
      const resolved = await resolveConnection();
      cid = resolved.connectionId;
      clt = resolved.clientId;
    }
    if (!cid || !clt) return;
    const jid = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
    setLoadingJid(jid);
    await resumeContact(cid, clt, jid);
    await refresh(cid);
    setLoadingJid(null);
  }, [connectionId, clientId, resolveConnection, refresh]);

  return { isLeadPaused, getLeadEntry, pause, resume, loadingJid, handoffMap };
}

type ActiveTab = 'leads' | 'monitor';

export function LeadManager({ leads, connections, onSave }: LeadManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('leads');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const { isLeadPaused, getLeadEntry, pause, resume, loadingJid, handoffMap } = useHandoff(connections);

  const stages = [
    { id: 'all', label: 'All Leads', color: 'gray' },
    { id: 'new', label: 'New', color: 'blue' },
    { id: 'contacted', label: 'Contacted', color: 'yellow' },
    { id: 'interested', label: 'Interested', color: 'orange' },
    { id: 'qualified', label: 'Qualified', color: 'green' },
    { id: 'enrolled', label: 'Enrolled', color: 'purple' },
    { id: 'lost', label: 'Lost', color: 'red' }
  ];

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm);
    const matchesStage = selectedStage === 'all' || lead.stage === selectedStage;
    const matchesAlert = !showOnlyAlerts || isLeadPaused(lead.phone);
    return matchesSearch && matchesStage && matchesAlert;
  });

  const pausedCount = Object.values(handoffMap).filter(
    (e) => e.paused && new Date(e.expires_at) > new Date()
  ).length;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Lead Management</h2>
          <p className="text-gray-600">Track and manage your beauty course leads</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lead</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'leads'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Leads
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'monitor'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="h-4 w-4" />
          Monitor
          <LeadMonitorBadge handoffMap={handoffMap} />
        </button>
      </div>

      {activeTab === 'monitor' && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Atendimentos Humanos Ativos</h3>
              <p className="text-sm text-gray-500">Leads com bot pausado aguardando retomada</p>
            </div>
            {pausedCount > 0 && (
              <span className="text-sm text-amber-700 font-medium bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                {pausedCount} ativo{pausedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <MonitorAlertList handoffMap={handoffMap} />
        </div>
      )}

      {activeTab === 'leads' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              {pausedCount > 0 && (
                <button
                  onClick={() => setShowOnlyAlerts((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    showOnlyAlerts
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-amber-300 hover:text-amber-700'
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  Somente alertas
                  <LeadMonitorBadge handoffMap={handoffMap} />
                </button>
              )}
            </div>
          </div>

          {/* Lead Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stages.slice(1).map((stage) => {
              const count = leads.filter(lead => lead.stage === stage.id).length;
              return (
                <div key={stage.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{stage.label}</div>
                </div>
              );
            })}
          </div>

          {/* Leads List */}
          {filteredLeads.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedStage !== 'all' || showOnlyAlerts
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first lead or connecting WhatsApp to receive leads automatically'
                }
              </p>
              {!searchTerm && selectedStage === 'all' && !showOnlyAlerts && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add First Lead</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredLeads.map((lead) => {
                const paused = isLeadPaused(lead.phone);
                const entry = getLeadEntry(lead.phone);
                const jid = lead.phone.includes('@') ? lead.phone : `${lead.phone.replace(/\D/g, '')}@s.whatsapp.net`;
                const isLoading = loadingJid === jid || loadingJid === lead.phone;
                return (
                  <div key={lead.id} className={`bg-white rounded-xl p-6 border transition-shadow hover:shadow-lg ${paused ? 'border-amber-300' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                        <p className="text-gray-600">{lead.phone}</p>
                        {lead.email && <p className="text-sm text-gray-500">{lead.email}</p>}
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(lead.score)}`}>
                            <Star className="h-3 w-3 inline mr-1" />
                            {lead.score}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
                            {lead.stage}
                          </span>
                        </div>
                        {paused && entry ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 ${(new Date(entry.expires_at).getTime() - Date.now()) < 10 * 60 * 1000 ? 'animate-pulse' : ''}`}>
                            <UserCheck className="h-3 w-3 mr-1" />
                            HUMANO &bull; {getExpiryLabel(entry)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <Bot className="h-3 w-3 mr-1" />
                            BOT ATIVO
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(lead.city || lead.state) && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{lead.city}{lead.city && lead.state && ', '}{lead.state}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Ultimo contato: {new Date(lead.lastInteraction).toLocaleDateString('pt-BR')}</span>
                      </div>

                      {lead.interestedCourses.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Cursos de Interesse:</p>
                          <div className="flex flex-wrap gap-1">
                            {lead.interestedCourses.slice(0, 2).map((courseId) => (
                              <span key={courseId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {courseId.replace('-', ' ')}
                              </span>
                            ))}
                            {lead.interestedCourses.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                +{lead.interestedCourses.length - 2} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                          {lead.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              +{lead.tags.length - 3} mais
                            </span>
                          )}
                        </div>
                      )}

                      {lead.notes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700 line-clamp-2">{lead.notes}</p>
                        </div>
                      )}
                    </div>

                    <LeadTrackingPanel lead={lead} />

                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Origem: <span className="font-medium capitalize">
                            {lead.source === 'organic' ? 'Organico' :
                             lead.source === 'campaign' ? 'Campanha' :
                             lead.source === 'referral' ? 'Indicacao' :
                             lead.source === 'social' ? 'Redes Sociais' : 'Site'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <MessageCircle className="h-4 w-4" />
                          </button>
                          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Ver Detalhes
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {paused ? (
                          <button
                            onClick={() => resume(lead.phone)}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                            <span>Reativar Bot</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => pause(lead.phone)}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                            <span>Assumir Atendimento</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddLeadModal
          connections={connections}
          onClose={() => setShowAddModal(false)}
          onSave={(lead) => {
            onSave([...leads, lead]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function LeadTrackingPanel({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  const t = lead.tracking;
  const hasCampaign = lead.lastCampaignName || t?.campaignName;
  const hasContext = t?.entryChannel || t?.originPage || t?.originCourse || t?.ctaClicked || hasCampaign || lead.commercialStatus || lead.operationalStatus;

  if (!hasContext) return null;

  return (
    <div className="mt-3 border border-gray-100 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contexto de Origem</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-3 py-2.5 space-y-2 bg-white">
          {t?.entryChannel && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-400">Canal:</span>
              <span className="font-medium text-gray-700">{entryChannelLabel(t.entryChannel)}</span>
            </div>
          )}
          {t?.originPage && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-400">Pagina:</span>
              <span className="font-medium text-gray-700 truncate max-w-[180px]" title={t.originPage}>{t.originPage}</span>
            </div>
          )}
          {t?.originCourse && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-400">Curso:</span>
              <span className="font-medium text-gray-700">{t.originCourse}</span>
            </div>
          )}
          {t?.ctaClicked && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MousePointerClick className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-400">CTA:</span>
              <span className="font-medium text-gray-700">{t.ctaClicked}</span>
            </div>
          )}
          {hasCampaign && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Megaphone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-400">Campanha:</span>
              <span className="font-medium text-gray-700">{lead.lastCampaignName ?? t?.campaignName}</span>
            </div>
          )}
          {(lead.commercialStatus || lead.operationalStatus) && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {lead.commercialStatus && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${commercialStatusStyle(lead.commercialStatus)}`}>
                  {commercialStatusLabel(lead.commercialStatus)}
                </span>
              )}
              {lead.operationalStatus && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${operationalStatusStyle(lead.operationalStatus)}`}>
                  {operationalStatusLabel(lead.operationalStatus)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function commercialStatusLabel(status: NonNullable<Lead['commercialStatus']>): string {
  const labels: Record<NonNullable<Lead['commercialStatus']>, string> = {
    open: 'Aberto',
    in_progress: 'Em Andamento',
    proposal_sent: 'Proposta Enviada',
    won: 'Ganho',
    lost: 'Perdido',
  };
  return labels[status];
}

function commercialStatusStyle(status: NonNullable<Lead['commercialStatus']>): string {
  const styles: Record<NonNullable<Lead['commercialStatus']>, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    proposal_sent: 'bg-cyan-100 text-cyan-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  };
  return styles[status];
}

function operationalStatusLabel(status: NonNullable<Lead['operationalStatus']>): string {
  const labels: Record<NonNullable<Lead['operationalStatus']>, string> = {
    bot_active: 'Bot Ativo',
    human_assigned: 'Humano Atribuido',
    waiting: 'Aguardando',
    enrolled: 'Matriculado',
  };
  return labels[status];
}

function operationalStatusStyle(status: NonNullable<Lead['operationalStatus']>): string {
  const styles: Record<NonNullable<Lead['operationalStatus']>, string> = {
    bot_active: 'bg-green-100 text-green-700',
    human_assigned: 'bg-amber-100 text-amber-700',
    waiting: 'bg-gray-100 text-gray-600',
    enrolled: 'bg-teal-100 text-teal-700',
  };
  return styles[status];
}

const ENTRY_CHANNELS: { value: LeadEntryChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'Site' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'campaign', label: 'Campanha' },
  { value: 'social', label: 'Redes Sociais' },
  { value: 'referral', label: 'Indicacao' },
  { value: 'offer', label: 'Oferta' },
  { value: 'reactivation', label: 'Reativacao' },
];

function AddLeadModal({
  connections,
  onClose,
  onSave
}: {
  connections: WhatsAppConnection[];
  onClose: () => void;
  onSave: (lead: Lead) => void;
}) {
  const sessionTracking = getTrackingFromSession();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    source: 'organic' as Lead['source'],
    whatsappId: connections[0]?.id || '',
    interestedCourses: [] as string[],
    notes: ''
  });

  const [tracking, setTracking] = useState<Partial<LeadTracking>>({
    entryChannel: sessionTracking?.entryChannel ?? undefined,
    originPage: sessionTracking?.originPage ?? '',
    originCourse: sessionTracking?.originCourse ?? '',
    ctaClicked: sessionTracking?.ctaClicked ?? '',
    campaignName: sessionTracking?.campaignName ?? '',
    utmSource: sessionTracking?.utmSource ?? '',
    utmCampaign: sessionTracking?.utmCampaign ?? '',
  });

  const [showOriginSection, setShowOriginSection] = useState(
    !!(sessionTracking?.entryChannel || sessionTracking?.originPage || sessionTracking?.originCourse)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTracking: LeadTracking = {
      ...sessionTracking,
      entryChannel: tracking.entryChannel,
      originPage: tracking.originPage || undefined,
      originCourse: tracking.originCourse || undefined,
      ctaClicked: tracking.ctaClicked || undefined,
      campaignName: tracking.campaignName || undefined,
      utmSource: tracking.utmSource || undefined,
      utmCampaign: tracking.utmCampaign || undefined,
      capturedAt: sessionTracking?.capturedAt ?? new Date().toISOString(),
    };

    const hasTracking = Object.values(cleanTracking).some(v => v !== undefined && v !== '');

    const newLead: Lead = {
      id: Date.now().toString(),
      ...formData,
      tags: [],
      score: 50,
      stage: 'new',
      createdAt: new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
      interactions: [],
      customFields: {},
      tracking: hasTracking ? cleanTracking : undefined,
      lastCampaignName: tracking.campaignName || undefined,
      lastCampaignId: tracking.campaignId || sessionTracking?.campaignId || undefined,
    };

    onSave(newLead);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Adicionar Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Maria Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                Conexao WhatsApp
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sao Paulo"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origem
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value as Lead['source']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="organic">Organico</option>
                <option value="campaign">Campanha</option>
                <option value="referral">Indicacao</option>
                <option value="social">Redes Sociais</option>
                <option value="website">Site</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Informacoes adicionais sobre este lead..."
            />
          </div>

          {/* Origin context section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOriginSection(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Contexto de Origem</span>
                {sessionTracking && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Pre-preenchido
                  </span>
                )}
              </div>
              {showOriginSection
                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                : <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </button>

            {showOriginSection && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canal de Entrada
                    </label>
                    <select
                      value={tracking.entryChannel ?? ''}
                      onChange={(e) => setTracking({ ...tracking, entryChannel: e.target.value as LeadEntryChannel || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Nao definido</option>
                      {ENTRY_CHANNELS.map(ch => (
                        <option key={ch.value} value={ch.value}>{ch.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pagina de Origem
                    </label>
                    <input
                      type="text"
                      value={tracking.originPage ?? ''}
                      onChange={(e) => setTracking({ ...tracking, originPage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: /curso-microblading"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Curso de Interesse
                    </label>
                    <input
                      type="text"
                      value={tracking.originCourse ?? ''}
                      onChange={(e) => setTracking({ ...tracking, originCourse: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: Microblading Avancado"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CTA Clicado
                    </label>
                    <input
                      type="text"
                      value={tracking.ctaClicked ?? ''}
                      onChange={(e) => setTracking({ ...tracking, ctaClicked: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: Quero me inscrever"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campanha Associada
                    </label>
                    <input
                      type="text"
                      value={tracking.campaignName ?? ''}
                      onChange={(e) => setTracking({ ...tracking, campaignName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: Black Friday 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UTM Source
                    </label>
                    <input
                      type="text"
                      value={tracking.utmSource ?? ''}
                      onChange={(e) => setTracking({ ...tracking, utmSource: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: instagram"
                    />
                  </div>
                </div>
              </div>
            )}
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