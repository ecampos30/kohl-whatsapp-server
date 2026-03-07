export interface WhatsAppAccount {
  id: string;
  number: string;
  name: string;
  persona: string;
  businessType: string;
  timezone: string;
  status: 'active' | 'inactive' | 'pending';
  businessHours: {
    start: string;
    end: string;
    days: number[];
  };
  aiConfig: {
    systemMessage: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
  };
}

export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  city?: string;
  state?: string;
  source: 'instagram' | 'site' | 'anuncio' | 'indicacao' | 'outro';
  tags: string[];
  stage: 'novo' | 'qualificando' | 'oportunidade' | 'cliente' | 'perdido';
  score: number;
  lastInteraction: string;
  owner?: string;
  notes: string;
  accountId: string;
}

export interface Campaign {
  id: string;
  name: string;
  accountId: string;
  status: 'active' | 'paused' | 'completed';
  schedule: {
    time: string;
    timezone: string;
    frequency: 'once' | 'daily' | 'weekly';
  };
  content: {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    mediaUrl?: string;
    buttons?: Array<{ text: string; action: string }>;
  };
  segmentation: {
    tags?: string[];
    score?: { min: number; max: number };
    stage?: string[];
  };
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    replied: number;
  };
}