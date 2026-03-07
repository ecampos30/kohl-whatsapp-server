// Configurações de conexão WhatsApp
export interface WhatsAppConnectionConfig {
  id: string;
  name: string;
  phone: string;
  type: 'web' | 'business_api';
  status: 'connected' | 'disconnected' | 'scanning' | 'error' | 'pending';
  
  // WhatsApp Web (QR Code)
  webSession?: {
    qrCode?: string;
    sessionData?: string;
    lastScan?: string;
  };
  
  // WhatsApp Business API
  businessApi?: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookVerifyToken: string;
    appId: string;
    appSecret: string;
  };
  
  // Configurações gerais
  settings: {
    welcomeMessage: string;
    fallbackMessage: string;
    businessHours: {
      enabled: boolean;
      start: string;
      end: string;
      days: number[];
      message: string;
    };
  };
  
  // Métricas
  metrics: {
    messagesReceived: number;
    messagesSent: number;
    lastActivity?: string;
  };
}

export interface ConnectionManager {
  connections: WhatsAppConnectionConfig[];
  activeConnections: string[];
  fallbackMode: 'web_only' | 'api_only' | 'auto_fallback';
}

// Tipos de mensagem suportados
export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  type: 'text' | 'image' | 'video' | 'document' | 'audio' | 'interactive';
  timestamp: string;
  
  // Conteúdo
  text?: {
    body: string;
  };
  
  image?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  
  video?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  
  document?: {
    id?: string;
    link?: string;
    filename?: string;
    caption?: string;
  };
  
  interactive?: {
    type: 'button' | 'list';
    header?: {
      type: 'text' | 'image' | 'video';
      text?: string;
      image?: { link: string };
      video?: { link: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

// Status da conexão
export interface ConnectionStatus {
  id: string;
  type: 'web' | 'business_api';
  status: 'connected' | 'disconnected' | 'scanning' | 'error';
  lastCheck: string;
  errorMessage?: string;
  qrCode?: string;
}