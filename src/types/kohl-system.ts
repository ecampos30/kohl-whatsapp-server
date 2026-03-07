export interface WhatsAppConnection {
  id: string;
  name: string;
  number: string;
  status: 'connected' | 'disconnected' | 'scanning' | 'error';
  qrCode?: string;
  lastActivity: string;
  messageCount: number;
  connectionType: 'web' | 'api';
  apiCredentials?: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
  };
}

export interface AIConfiguration {
  id: string;
  whatsappId: string;
  openaiApiKey: string;
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  persona: {
    tone: 'cordial' | 'objective' | 'welcoming' | 'professional';
    language: 'pt-BR' | 'en' | 'es';
    customInstructions: string;
  };
  scope: {
    canHandle: string[];
    escalationTriggers: string[];
    maxTokens: number;
    temperature: number;
  };
  ragKnowledgeBase: {
    faqs: FAQ[];
    documents: Document[];
    courseInfo: CourseInfo[];
  };
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  priority: number;
}

export interface Document {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'doc' | 'link';
  category: string;
  content?: string; // Extracted text for RAG
}

export interface CourseInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  prerequisites: string[];
  syllabus: string[];
  nextDates: string[];
  instructor: string;
  materials: string[];
}

export interface MenuTemplate {
  id: string;
  name: string;
  whatsappId: string;
  isActive: boolean;
  welcomeMessage: string;
  options: MenuOption[];
  fallbackMessage: string;
  escalationOption: MenuOption;
}

export interface MenuOption {
  id: string;
  number: string;
  text: string;
  action: 'course_info' | 'sub_menu' | 'escalate' | 'custom_flow';
  courseId?: string;
  subMenuId?: string;
  flowId?: string;
  customResponse?: string;
}

export interface Campaign {
  id: string;
  name: string;
  whatsappId: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  type: 'broadcast' | 'sequence' | 'trigger';
  schedule: {
    startDate: string;
    endDate?: string;
    time: string;
    timezone: string;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    days?: number[]; // 0-6 for weekly
  };
  targeting: {
    segments: string[];
    tags: string[];
    leadScore?: { min: number; max: number };
    lastInteraction?: { days: number; operator: 'before' | 'after' };
  };
  content: CampaignMessage[];
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    clicked: number;
    converted: number;
  };
}

export interface CampaignMessage {
  id: string;
  order: number;
  delay?: number; // minutes
  content: {
    type: 'text' | 'image' | 'video' | 'document' | 'template';
    text?: string;
    mediaUrl?: string;
    buttons?: MessageButton[];
    template?: {
      name: string;
      parameters: Record<string, string>;
    };
  };
  conditions?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: string;
  }[];
}

export interface MessageButton {
  id: string;
  type: 'url' | 'phone' | 'quick_reply';
  text: string;
  value: string;
}

export interface Lead {
  id: string;
  whatsappId: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  source: 'organic' | 'campaign' | 'referral' | 'social' | 'website';
  tags: string[];
  score: number;
  stage: 'new' | 'contacted' | 'interested' | 'qualified' | 'proposal' | 'enrolled' | 'lost';
  interestedCourses: string[];
  budget?: number;
  timeline?: string;
  notes: string;
  assignedAgent?: string;
  createdAt: string;
  lastInteraction: string;
  interactions: Interaction[];
  customFields: Record<string, any>;
}

export interface Interaction {
  id: string;
  type: 'message_in' | 'message_out' | 'call' | 'email' | 'note';
  content: string;
  timestamp: string;
  agentId?: string;
  automated: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface Flow {
  id: string;
  name: string;
  whatsappId: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: 'keyword' | 'menu_option' | 'tag' | 'schedule' | 'webhook';
    value: string;
    conditions?: any[];
  };
  steps: FlowStep[];
  analytics: {
    started: number;
    completed: number;
    dropoffPoints: Record<string, number>;
  };
}

export interface FlowStep {
  id: string;
  type: 'message' | 'wait' | 'condition' | 'action' | 'human_handoff';
  order: number;
  config: {
    message?: CampaignMessage;
    waitTime?: number;
    condition?: {
      field: string;
      operator: string;
      value: string;
      trueStep: string;
      falseStep: string;
    };
    action?: {
      type: 'add_tag' | 'remove_tag' | 'update_field' | 'send_webhook';
      value: string;
    };
  };
  nextStep?: string;
}

export interface Analytics {
  whatsappId: string;
  period: {
    start: string;
    end: string;
  };
  messages: {
    sent: number;
    received: number;
    automated: number;
    manual: number;
  };
  leads: {
    new: number;
    qualified: number;
    converted: number;
    conversionRate: number;
  };
  courses: {
    inquiries: Record<string, number>;
    enrollments: Record<string, number>;
  };
  aiPerformance: {
    handled: number;
    escalated: number;
    satisfaction: number;
    avgResponseTime: number;
  };
  campaigns: {
    active: number;
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  permissions: string[];
  whatsappAccess: string[]; // WhatsApp IDs they can access
  isActive: boolean;
  lastLogin: string;
}

export interface SystemSettings {
  businessInfo: {
    name: string;
    logo: string;
    timezone: string;
    businessHours: {
      start: string;
      end: string;
      days: number[];
    };
  };
  integrations: {
    openai: {
      apiKey: string;
      organization?: string;
    };
    webhook: {
      url: string;
      secret: string;
      events: string[];
    };
    crm: {
      type: 'hubspot' | 'salesforce' | 'pipedrive' | 'custom';
      apiKey: string;
      endpoint: string;
    };
  };
  compliance: {
    gdprEnabled: boolean;
    dataRetentionDays: number;
    optInRequired: boolean;
    unsubscribeKeyword: string;
  };
}