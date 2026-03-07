// Tipos principais do sistema
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin_global' | 'admin_conta' | 'operador';
  accounts_access: string[]; // IDs das contas que pode acessar
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface Account {
  id: string;
  name: string;
  owner_id: string; // ID do admin da conta
  plan: 'basico' | 'profissional' | 'empresarial';
  max_numbers: number;
  created_at: string;
  is_active: boolean;
  settings: {
    timezone: string;
    business_hours: {
      start: string;
      end: string;
      days: number[];
    };
    compliance: {
      lgpd_enabled: boolean;
      opt_in_required: boolean;
      data_retention_days: number;
    };
  };
}

export interface WhatsAppNumber {
  id: string;
  account_id: string;
  name: string; // Ex: "Comercial", "Suporte"
  phone: string;
  connection_type: 'web' | 'api_oficial';
  status: 'conectado' | 'desconectado' | 'escaneando' | 'erro';
  qr_code?: string;
  last_activity: string;
  api_credentials?: {
    access_token: string;
    phone_number_id: string;
    business_account_id: string;
  };
  settings: {
    welcome_message: string;
    fallback_message: string;
    business_hours_message: string;
  };
}

export interface MenuItem {
  id: string;
  number_id: string;
  order: number;
  title: string;
  slug: string;
  description: string;
  image_url?: string;
  price?: number;
  is_active: boolean;
  secondary_menu: {
    matricular_text: string;
    atendente_text: string;
  };
}

export interface Lead {
  id: string;
  account_id: string;
  number_id: string;
  whatsapp: string;
  name?: string;
  first_name?: string;
  email?: string;
  city?: string;
  state?: string;
  tags: string[];
  stage: 'novo' | 'qualificando' | 'oportunidade' | 'cliente' | 'perdido';
  score: number;
  source: string; // Ex: "menu:nanoblading"
  owner_id?: string; // ID do atendente responsável
  notes: string;
  qualification?: {
    objetivo: string;
    orcamento: 'baixo' | 'medio' | 'alto';
    cidade: string;
    modalidade: 'presencial' | 'online' | 'ambos';
    urgencia: 1 | 2 | 3;
    experiencia: 'iniciante' | 'intermediario' | 'avancado';
  };
  opt_in: {
    date: string;
    source: string;
    ip?: string;
  };
  opt_out?: {
    date: string;
    reason: string;
  };
  created_at: string;
  last_interaction: string;
  interactions: Interaction[];
}

export interface Interaction {
  id: string;
  lead_id: string;
  type: 'message_in' | 'message_out' | 'ai_response' | 'handoff' | 'note';
  content: string;
  media_url?: string;
  user_id?: string; // Se foi atendente humano
  ai_confidence?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AIConfig {
  id: string;
  number_id: string;
  openai_api_key: string;
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  persona: {
    tone: 'cordial' | 'objetivo' | 'acolhedor' | 'profissional';
    instructions: string;
    scope: string[]; // Tópicos que pode atender
    escalation_triggers: string[]; // Gatilhos para handoff
  };
  rag_config: {
    knowledge_base: KnowledgeItem[];
    confidence_threshold: number;
  };
  settings: {
    max_tokens: number;
    temperature: number;
    timeout_seconds: number;
  };
}

export interface KnowledgeItem {
  id: string;
  type: 'faq' | 'pdf' | 'url' | 'text';
  title: string;
  content: string;
  url?: string;
  tags: string[];
  created_at: string;
  indexed_at?: string;
}

export interface Campaign {
  id: string;
  account_id: string;
  number_id: string;
  name: string;
  type: 'broadcast' | 'sequence' | 'trigger';
  status: 'rascunho' | 'ativa' | 'pausada' | 'finalizada';
  messages: CampaignMessage[];
  targeting: {
    tags: string[];
    stages: string[];
    cities?: string[];
    engagement?: 'abriu' | 'clicou' | 'respondeu';
    exclude_tags?: string[];
  };
  schedule: {
    start_date: string;
    timezone: string;
    intervals: number[]; // Minutos entre mensagens
  };
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    replied: number;
    opt_outs: number;
  };
  created_at: string;
  created_by: string;
}

export interface CampaignMessage {
  id: string;
  order: number;
  type: 'text' | 'image' | 'video' | 'document' | 'menu' | 'list' | 'poll';
  content: {
    text?: string;
    media_url?: string;
    buttons?: MessageButton[];
    list_items?: ListItem[];
    poll_options?: string[];
  };
  variables: Record<string, string>; // Para substituição dinâmica
}

export interface MessageButton {
  id: string;
  text: string;
  type: 'reply' | 'url' | 'phone';
  value: string;
}

export interface ListItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
}

export interface Template {
  id: string;
  account_id: string;
  name: string;
  category: 'boas_vindas' | 'conteudo' | 'oferta' | 'reengajamento';
  language: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  components: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  format?: 'text' | 'image' | 'video' | 'document';
  text?: string;
  example?: string[];
  buttons?: TemplateButton[];
}

export interface TemplateButton {
  type: 'quick_reply' | 'url' | 'phone_number';
  text: string;
  url?: string;
  phone_number?: string;
}

export interface Analytics {
  account_id: string;
  number_id?: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    messages: {
      sent: number;
      received: number;
      ai_handled: number;
      human_handled: number;
    };
    leads: {
      new: number;
      qualified: number;
      converted: number;
      conversion_rate: number;
    };
    campaigns: {
      active: number;
      total_sent: number;
      avg_open_rate: number;
      avg_click_rate: number;
    };
    ai_performance: {
      total_interactions: number;
      successful_resolutions: number;
      escalations: number;
      avg_confidence: number;
      avg_response_time: number;
    };
  };
}

export interface Webhook {
  id: string;
  account_id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  last_triggered?: string;
  retry_count: number;
}

export interface Group {
  id: string;
  number_id: string;
  whatsapp_group_id: string;
  name: string;
  description?: string;
  participants_count: number;
  is_active: boolean;
  rules: {
    allow_campaigns: boolean;
    require_opt_in: boolean;
    max_messages_per_day: number;
  };
  created_at: string;
}

// Tipos para formulários e UI
export interface MenuBuilderState {
  items: MenuItem[];
  selectedItem?: MenuItem;
  isEditing: boolean;
  previewMode: boolean;
}

export interface CampaignBuilderState {
  campaign: Partial<Campaign>;
  currentStep: number;
  isPreview: boolean;
  selectedAudience: Lead[];
}

export interface LeadFilters {
  tags?: string[];
  stages?: string[];
  cities?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  score_range?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface SystemSettings {
  smtp: {
    host: string;
    port: number;
    username: string;
    password: string;
    from_email: string;
  };
  integrations: {
    openai_default_key?: string;
    webhook_base_url: string;
    crm_sync_enabled: boolean;
  };
  limits: {
    max_accounts_per_admin: number;
    max_numbers_per_account: number;
    max_campaigns_per_month: number;
    max_leads_per_account: number;
  };
}