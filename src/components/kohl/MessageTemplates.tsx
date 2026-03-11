import React, { useState, useMemo } from 'react';
import { Plus, Search, Eye, CreditCard as Edit2, Trash2, Check, X, ChevronDown, ChevronUp, MessageSquare, Link, Zap, RotateCcw, CheckCircle2, Send, FileText, Tag } from 'lucide-react';
import {
  MessageTemplate,
  MessageTemplateCategory,
  MessageTemplateType,
  LeadStage,
  TemplateVariable,
} from '../../types/kohl-system';
import {
  loadTemplates,
  saveTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  CATEGORY_LABELS,
  TYPE_LABELS,
  STAGE_LABELS,
  resolveTemplateVariables,
} from '../../services/messageTemplateService';

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [MessageTemplateCategory, string][];
const TYPES = Object.entries(TYPE_LABELS) as [MessageTemplateType, string][];
const STAGES = Object.entries(STAGE_LABELS) as [LeadStage, string][];

const TYPE_ICONS: Record<MessageTemplateType, React.ReactNode> = {
  reactivation: <RotateCcw className="h-3.5 w-3.5" />,
  follow_up: <MessageSquare className="h-3.5 w-3.5" />,
  urgency: <Zap className="h-3.5 w-3.5" />,
  confirmation: <CheckCircle2 className="h-3.5 w-3.5" />,
  closing: <Check className="h-3.5 w-3.5" />,
  cta: <Send className="h-3.5 w-3.5" />,
  link: <Link className="h-3.5 w-3.5" />,
  custom: <FileText className="h-3.5 w-3.5" />,
};

const CATEGORY_COLORS: Record<MessageTemplateCategory, string> = {
  greeting: 'bg-blue-100 text-blue-700',
  pricing: 'bg-emerald-100 text-emerald-700',
  objection: 'bg-orange-100 text-orange-700',
  closing: 'bg-green-100 text-green-700',
  payment_proof: 'bg-teal-100 text-teal-700',
  reactivation: 'bg-amber-100 text-amber-700',
  campaign: 'bg-sky-100 text-sky-700',
  cold_lead: 'bg-slate-100 text-slate-700',
  hot_lead: 'bg-red-100 text-red-700',
  post_pricing: 'bg-cyan-100 text-cyan-700',
  post_negotiation: 'bg-lime-100 text-lime-700',
};

const EMPTY_TEMPLATE: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  category: 'greeting',
  type: 'custom',
  body: '',
  footer: '',
  ctaLabel: '',
  ctaUrl: '',
  linkedStages: [],
  campaignName: '',
  variables: [],
  isActive: true,
  mediaPlaceholder: false,
};

export function MessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => loadTemplates());
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<MessageTemplateCategory | 'all'>('all');
  const [filterType, setFilterType] = useState<MessageTemplateType | 'all'>('all');
  const [filterStage, setFilterStage] = useState<LeadStage | 'all'>('all');
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const persist = (next: MessageTemplate[]) => {
    setTemplates(next);
    saveTemplates(next);
  };

  const handleSave = (tpl: MessageTemplate | Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if ('id' in tpl) {
      persist(updateTemplate(templates, tpl as MessageTemplate));
    } else {
      const created = createTemplate(tpl);
      persist([...templates, created]);
    }
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    persist(deleteTemplate(templates, id));
    setDeleteConfirm(null);
  };

  const handleToggleActive = (id: string) => {
    const next = templates.map(t =>
      t.id === id ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() } : t
    );
    persist(next);
  };

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !t.body.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterStage !== 'all' && !t.linkedStages?.includes(filterStage)) return false;
      return true;
    });
  }, [templates, search, filterCategory, filterType, filterStage]);

  const openPreview = (tpl: MessageTemplate) => {
    setPreviewTemplate(tpl);
    const init: Record<string, string> = {};
    tpl.variables?.forEach(v => { init[v.key] = v.defaultValue ?? ''; });
    setPreviewVars(init);
  };

  if (editingTemplate || isCreating) {
    return (
      <TemplateEditor
        template={editingTemplate ?? undefined}
        onSave={handleSave}
        onCancel={() => { setEditingTemplate(null); setIsCreating(false); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Templates de Mensagem</h2>
          <p className="text-gray-600">Crie e gerencie mensagens reutilizaveis para o funil comercial</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Template
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={templates.length} color="blue" />
        <StatCard label="Ativos" value={templates.filter(t => t.isActive).length} color="green" />
        <StatCard label="Inativos" value={templates.filter(t => !t.isActive).length} color="gray" />
        <StatCard label="Com CTA" value={templates.filter(t => t.ctaLabel).length} color="amber" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou conteudo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            value={filterCategory}
            onChange={v => setFilterCategory(v as MessageTemplateCategory | 'all')}
            options={[['all', 'Todas as categorias'], ...CATEGORIES]}
          />
          <FilterSelect
            value={filterType}
            onChange={v => setFilterType(v as MessageTemplateType | 'all')}
            options={[['all', 'Todos os tipos'], ...TYPES]}
          />
          <FilterSelect
            value={filterStage}
            onChange={v => setFilterStage(v as LeadStage | 'all')}
            options={[['all', 'Todos os estagios'], ...STAGES]}
          />
        </div>
      </div>

      {/* Template list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Nenhum template encontrado</p>
          <button
            onClick={() => setIsCreating(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Criar primeiro template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(tpl => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onEdit={() => setEditingTemplate(tpl)}
              onPreview={() => openPreview(tpl)}
              onToggleActive={() => handleToggleActive(tpl.id)}
              onDelete={() => setDeleteConfirm(tpl.id)}
              deleteConfirm={deleteConfirm === tpl.id}
              onDeleteConfirm={() => handleDelete(tpl.id)}
              onDeleteCancel={() => setDeleteConfirm(null)}
            />
          ))}
        </div>
      )}

      {previewTemplate && (
        <MessagePreviewModal
          template={previewTemplate}
          vars={previewVars}
          onVarsChange={setPreviewVars}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    gray: 'text-gray-600',
    amber: 'text-amber-700',
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${colorMap[color] ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}

function TemplateCard({
  template,
  onEdit,
  onPreview,
  onToggleActive,
  onDelete,
  deleteConfirm,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  template: MessageTemplate;
  onEdit: () => void;
  onPreview: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  deleteConfirm: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}) {
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const bodyPreview = template.body.length > 120 && !bodyExpanded
    ? template.body.slice(0, 120) + '...'
    : template.body;

  return (
    <div className={`bg-white rounded-xl border transition-shadow hover:shadow-md ${template.isActive ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[template.category]}`}>
                <Tag className="h-3 w-3" />
                {CATEGORY_LABELS[template.category]}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {TYPE_ICONS[template.type]}
                {TYPE_LABELS[template.type]}
              </span>
              {!template.isActive && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                  Inativo
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 truncate">{template.name}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{bodyPreview}</p>
          {template.body.length > 120 && (
            <button
              onClick={() => setBodyExpanded(v => !v)}
              className="mt-1 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
            >
              {bodyExpanded ? <><ChevronUp className="h-3 w-3" /> Menos</> : <><ChevronDown className="h-3 w-3" /> Ver mais</>}
            </button>
          )}
        </div>

        {/* CTA */}
        {(template.ctaLabel || template.ctaUrl) && (
          <div className="mb-3 flex items-center gap-2">
            {template.ctaLabel && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg">
                <Send className="h-3 w-3" />
                {template.ctaLabel}
              </div>
            )}
            {template.ctaUrl && (
              <div className="flex items-center gap-1 text-xs text-blue-500">
                <Link className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{template.ctaUrl}</span>
              </div>
            )}
          </div>
        )}

        {/* Stages */}
        {template.linkedStages && template.linkedStages.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.linkedStages.map(s => (
              <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                {STAGE_LABELS[s]}
              </span>
            ))}
          </div>
        )}

        {/* Campaign */}
        {template.campaignName && (
          <div className="text-xs text-gray-500 mb-3">
            Campanha: <span className="font-medium text-gray-700">{template.campaignName}</span>
          </div>
        )}

        {/* Footer */}
        {template.footer && (
          <div className="text-xs text-gray-400 italic mb-3">{template.footer}</div>
        )}

        {/* Actions */}
        {deleteConfirm ? (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <span className="text-xs text-red-600 flex-1">Confirmar exclusao?</span>
            <button onClick={onDeleteConfirm} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors">
              Excluir
            </button>
            <button onClick={onDeleteCancel} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors">
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={onPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              onClick={onToggleActive}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                template.isActive
                  ? 'bg-green-100 hover:bg-green-200 text-green-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              {template.isActive ? 'Ativo' : 'Inativo'}
            </button>
            <button
              onClick={onDelete}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateEditor({
  template,
  onSave,
  onCancel,
}: {
  template?: MessageTemplate;
  onSave: (tpl: MessageTemplate | Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>>(() => {
    if (template) {
      const { id, createdAt, updatedAt, ...rest } = template;
      return rest;
    }
    return { ...EMPTY_TEMPLATE };
  });

  const [varInput, setVarInput] = useState({ key: '', label: '' });
  const [showPreview, setShowPreview] = useState(false);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (template) {
      onSave({ ...template, ...form });
    } else {
      onSave(form);
    }
  };

  const addVariable = () => {
    if (!varInput.key.trim()) return;
    const exists = form.variables?.some(v => v.key === varInput.key);
    if (exists) return;
    setForm(f => ({
      ...f,
      variables: [...(f.variables ?? []), { key: varInput.key.trim(), label: varInput.label.trim() || varInput.key.trim() }],
    }));
    setVarInput({ key: '', label: '' });
  };

  const removeVariable = (key: string) => {
    setForm(f => ({ ...f, variables: f.variables?.filter(v => v.key !== key) }));
  };

  const toggleStage = (stage: LeadStage) => {
    const current = form.linkedStages ?? [];
    setForm(f => ({
      ...f,
      linkedStages: current.includes(stage) ? current.filter(s => s !== stage) : [...current, stage],
    }));
  };

  const previewBody = resolveTemplateVariables(form.body, previewVars);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {template ? 'Editar Template' : 'Novo Template'}
          </h2>
          <p className="text-gray-600 text-sm">Configure o conteudo e contexto da mensagem</p>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main form - left */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Identificacao</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Template *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="ex: Reativacao Lead Frio"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as MessageTemplateCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {CATEGORIES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as MessageTemplateType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {TYPES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Campanha (opcional)</label>
              <input
                type="text"
                value={form.campaignName ?? ''}
                onChange={e => setForm(f => ({ ...f, campaignName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Nome da campanha associada"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${form.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-gray-700">{form.isActive ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>

          {/* Message body */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Conteudo</h3>
              <button
                type="button"
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Eye className="h-3.5 w-3.5" />
                {showPreview ? 'Ocultar preview' : 'Ver preview'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Corpo da mensagem *
                <span className="ml-2 text-xs text-gray-400 font-normal">Use {'{{variavel}}'} para campos dinamicos</span>
              </label>
              <textarea
                required
                rows={6}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                placeholder={'Ola {{nome}}! Tudo bem?'}
              />
              <div className="mt-1 text-right text-xs text-gray-400">{form.body.length} caracteres</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rodape (opcional)</label>
              <input
                type="text"
                value={form.footer ?? ''}
                onChange={e => setForm(f => ({ ...f, footer: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="ex: Responda SAIR para cancelar"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Texto do CTA</label>
                <input
                  type="text"
                  value={form.ctaLabel ?? ''}
                  onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="ex: Quero me inscrever"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL do CTA</label>
                <input
                  type="text"
                  value={form.ctaUrl ?? ''}
                  onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="https://... ou {{link}}"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, mediaPlaceholder: !f.mediaPlaceholder }))}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${form.mediaPlaceholder ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.mediaPlaceholder ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-gray-700">Reservar espaco para imagem/midia</span>
            </div>
          </div>

          {/* Variables */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Variaveis Dinamicas</h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={varInput.key}
                onChange={e => setVarInput(v => ({ ...v, key: e.target.value.replace(/\s/g, '_') }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="chave (ex: nome)"
              />
              <input
                type="text"
                value={varInput.label}
                onChange={e => setVarInput(v => ({ ...v, label: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="descricao (ex: Nome do Lead)"
              />
              <button
                type="button"
                onClick={addVariable}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {(form.variables ?? []).length > 0 && (
              <div className="space-y-2">
                {form.variables!.map(v => (
                  <div key={v.key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3">
                      <code className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{`{{${v.key}}}`}</code>
                      <span className="text-xs text-gray-600">{v.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariable(v.key)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stages */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Estagio do Funil</h3>
            <div className="flex flex-wrap gap-2">
              {STAGES.map(([stage, label]) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => toggleStage(stage as LeadStage)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    form.linkedStages?.includes(stage as LeadStage)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">Selecione os estagios onde este template pode ser usado</p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {template ? 'Salvar Alteracoes' : 'Criar Template'}
            </button>
          </div>
        </div>

        {/* Preview panel - right */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            {showPreview && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Preencher variaveis</h3>
                  {(form.variables ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400">Nenhuma variavel definida</p>
                  ) : (
                    form.variables!.map(v => (
                      <div key={v.key}>
                        <label className="block text-xs text-gray-500 mb-1">{v.label}</label>
                        <input
                          type="text"
                          value={previewVars[v.key] ?? ''}
                          onChange={e => setPreviewVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={v.defaultValue ?? v.label}
                        />
                      </div>
                    ))
                  )}
                </div>
                <WhatsAppMessagePreview
                  body={previewBody}
                  footer={form.footer}
                  ctaLabel={form.ctaLabel}
                  ctaUrl={form.ctaUrl}
                  mediaPlaceholder={form.mediaPlaceholder}
                  templateName={form.name || 'Preview'}
                />
              </>
            )}

            {!showPreview && (
              <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <Eye className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Clique em "Ver preview" para visualizar a mensagem</p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function WhatsAppMessagePreview({
  body,
  footer,
  ctaLabel,
  ctaUrl,
  mediaPlaceholder,
  templateName,
}: {
  body: string;
  footer?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  mediaPlaceholder?: boolean;
  templateName?: string;
}) {
  return (
    <div className="bg-[#e5ddd5] rounded-xl p-4 space-y-1">
      <div className="text-xs text-gray-500 font-medium mb-2 text-center">{templateName}</div>

      <div className="flex justify-end">
        <div className="bg-[#dcf8c6] rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm">
          {mediaPlaceholder && (
            <div className="w-full h-28 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-xs text-gray-400">[ imagem / midia ]</span>
            </div>
          )}

          <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{body || <span className="text-gray-400 italic">Mensagem vazia...</span>}</p>

          {footer && (
            <p className="text-xs text-gray-500 mt-1.5 border-t border-gray-200 pt-1">{footer}</p>
          )}

          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-gray-400">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ✓✓
            </span>
          </div>
        </div>
      </div>

      {ctaLabel && (
        <div className="flex justify-center pt-1">
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm flex items-center gap-2 text-sm text-blue-600 font-medium">
            {ctaUrl ? <Link className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
            {ctaLabel}
          </div>
        </div>
      )}
    </div>
  );
}

function MessagePreviewModal({
  template,
  vars,
  onVarsChange,
  onClose,
}: {
  template: MessageTemplate;
  vars: Record<string, string>;
  onVarsChange: (v: Record<string, string>) => void;
  onClose: () => void;
}) {
  const resolvedBody = resolveTemplateVariables(template.body, vars);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[template.category]}`}>
              {CATEGORY_LABELS[template.category]}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {(template.variables ?? []).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Preencher variaveis</h4>
              {template.variables!.map(v => (
                <div key={v.key}>
                  <label className="block text-xs text-gray-500 mb-1">{v.label}</label>
                  <input
                    type="text"
                    value={vars[v.key] ?? ''}
                    onChange={e => onVarsChange({ ...vars, [v.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={v.defaultValue ?? v.label}
                  />
                </div>
              ))}
            </div>
          )}

          <WhatsAppMessagePreview
            body={resolvedBody}
            footer={template.footer}
            ctaLabel={template.ctaLabel}
            ctaUrl={template.ctaUrl}
            mediaPlaceholder={template.mediaPlaceholder}
            templateName={template.name}
          />
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
