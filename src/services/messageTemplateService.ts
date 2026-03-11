import { MessageTemplate, MessageTemplateCategory, MessageTemplateType, LeadStage } from '../types/kohl-system';

const STORAGE_KEY = 'kohl_message_templates';

export const CATEGORY_LABELS: Record<MessageTemplateCategory, string> = {
  greeting: 'Saudacao',
  pricing: 'Preco',
  objection: 'Objecao',
  closing: 'Fechamento',
  payment_proof: 'Comprovante',
  reactivation: 'Reativacao',
  campaign: 'Campanha',
  cold_lead: 'Lead Frio',
  hot_lead: 'Lead Quente',
  post_pricing: 'Pos-Preco',
  post_negotiation: 'Pos-Negociacao',
};

export const TYPE_LABELS: Record<MessageTemplateType, string> = {
  reactivation: 'Reativacao',
  follow_up: 'Follow-up',
  urgency: 'Urgencia',
  confirmation: 'Confirmacao',
  closing: 'Fechamento',
  cta: 'CTA Principal',
  link: 'Com Link',
  custom: 'Personalizado',
};

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  interested: 'Interessado',
  qualified: 'Qualificado',
  proposal: 'Proposta',
  enrolled: 'Matriculado',
  lost: 'Perdido',
};

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl_reativacao_1',
    name: 'Reativacao Lead Frio',
    category: 'reactivation',
    type: 'reactivation',
    body: 'Oi {{nome}}! Tudo bem? Notei que voce demonstrou interesse no curso de {{curso}} ha alguns dias. Ainda gostaria de saber mais?',
    ctaLabel: 'Sim, tenho interesse!',
    linkedStages: ['contacted', 'interested'],
    variables: [
      { key: 'nome', label: 'Nome do Lead' },
      { key: 'curso', label: 'Nome do Curso' },
    ],
    isActive: true,
    mediaPlaceholder: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_followup_1',
    name: 'Follow-up Pos-Preco',
    category: 'post_pricing',
    type: 'follow_up',
    body: 'Ola {{nome}}! Enviei os valores do curso de {{curso}} anteriormente. Ficou alguma duvida que eu possa esclarecer?',
    linkedStages: ['interested', 'qualified'],
    variables: [
      { key: 'nome', label: 'Nome do Lead' },
      { key: 'curso', label: 'Nome do Curso' },
    ],
    isActive: true,
    mediaPlaceholder: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_urgencia_1',
    name: 'Urgencia - Vagas Limitadas',
    category: 'hot_lead',
    type: 'urgency',
    body: '{{nome}}, so para avisar: ainda temos {{vagas}} vaga(s) disponivel(is) para a turma de {{curso}} em {{data}}. As inscricoes fecham em breve!',
    ctaLabel: 'Garantir minha vaga',
    linkedStages: ['qualified', 'proposal'],
    variables: [
      { key: 'nome', label: 'Nome do Lead' },
      { key: 'curso', label: 'Nome do Curso' },
      { key: 'vagas', label: 'Numero de Vagas' },
      { key: 'data', label: 'Data da Turma' },
    ],
    isActive: true,
    mediaPlaceholder: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_fechamento_1',
    name: 'Fechamento Direto',
    category: 'closing',
    type: 'closing',
    body: 'Ola {{nome}}! Para concluir sua inscricao no curso de {{curso}}, basta confirmar o pagamento. Posso te enviar o link de pagamento agora?',
    ctaLabel: 'Sim, enviar link',
    linkedStages: ['proposal'],
    variables: [
      { key: 'nome', label: 'Nome do Lead' },
      { key: 'curso', label: 'Nome do Curso' },
    ],
    isActive: true,
    mediaPlaceholder: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_confirmacao_1',
    name: 'Confirmacao de Matricula',
    category: 'greeting',
    type: 'confirmation',
    body: 'Parabens, {{nome}}! Sua inscricao no curso de {{curso}} foi confirmada! Em breve voce recebera todas as informacoes sobre o inicio das aulas.',
    linkedStages: ['enrolled'],
    variables: [
      { key: 'nome', label: 'Nome do Lead' },
      { key: 'curso', label: 'Nome do Curso' },
    ],
    isActive: true,
    mediaPlaceholder: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_link_1',
    name: 'Envio de Link de Pagamento',
    category: 'payment_proof',
    type: 'link',
    body: 'Ola {{nome}}! Segue o link para realizar o pagamento e garantir sua vaga no curso de {{curso}}:\n\n{{link_pagamento}}\n\nQualquer duvida, estou por aqui!',
    ctaLabel: 'Acessar link',
    ctaUrl: '{{link_pagamento}}',
    linkedStages: ['proposal'],
    variables: [
      { key: 'nome', label: 'Nome do Lead' },
      { key: 'curso', label: 'Nome do Curso' },
      { key: 'link_pagamento', label: 'Link de Pagamento' },
    ],
    isActive: true,
    mediaPlaceholder: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function loadTemplates(): MessageTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTemplates(DEFAULT_TEMPLATES);
      return DEFAULT_TEMPLATES;
    }
    return JSON.parse(raw) as MessageTemplate[];
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplates(templates: MessageTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // storage unavailable
  }
}

export function createTemplate(partial: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>): MessageTemplate {
  return {
    ...partial,
    id: `tpl_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateTemplate(
  templates: MessageTemplate[],
  updated: MessageTemplate
): MessageTemplate[] {
  return templates.map(t =>
    t.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : t
  );
}

export function deleteTemplate(templates: MessageTemplate[], id: string): MessageTemplate[] {
  return templates.filter(t => t.id !== id);
}

export function getTemplatesByStage(templates: MessageTemplate[], stage: LeadStage): MessageTemplate[] {
  return templates.filter(
    t => t.isActive && (!t.linkedStages?.length || t.linkedStages.includes(stage))
  );
}

export function resolveTemplateVariables(
  body: string,
  values: Record<string, string>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`);
}
