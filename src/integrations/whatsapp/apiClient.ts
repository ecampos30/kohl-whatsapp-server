// Cliente para WhatsApp Business API
import { WhatsAppConnectionConfig, WhatsAppMessage, ConnectionStatus } from '../../config/connections';

export class WhatsAppBusinessAPI {
  private connectionId: string;
  private config: WhatsAppConnectionConfig;
  private baseUrl: string = 'https://graph.facebook.com/v18.0';
  private isConnected: boolean = false;

  constructor(connectionId: string, config: WhatsAppConnectionConfig) {
    this.connectionId = connectionId;
    this.config = config;
  }

  // Validar credenciais da API
  async validateCredentials(): Promise<boolean> {
    if (!this.config.businessApi) {
      return false;
    }

    try {
      const { accessToken, phoneNumberId } = this.config.businessApi;
      
      const response = await fetch(`${this.baseUrl}/${phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.isConnected = true;
        console.log(`[WhatsApp API] Credenciais válidas para ${this.config.name}`);
        return true;
      } else {
        console.error(`[WhatsApp API] Credenciais inválidas para ${this.config.name}`);
        return false;
      }
      
    } catch (error) {
      console.error('[WhatsApp API] Erro ao validar credenciais:', error);
      return false;
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(to: string, text: string): Promise<boolean> {
    if (!this.config.businessApi || !this.isConnected) {
      throw new Error('WhatsApp Business API não está configurada ou conectada');
    }

    try {
      const { accessToken, phoneNumberId } = this.config.businessApi;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''), // Remover caracteres não numéricos
        type: 'text',
        text: {
          body: text
        }
      };

      const response = await fetch(`${this.baseUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[WhatsApp API] Mensagem enviada:`, result);
        
        // Atualizar métricas
        this.config.metrics.messagesSent++;
        this.config.metrics.lastActivity = new Date().toISOString();
        
        return true;
      } else {
        const error = await response.json();
        console.error('[WhatsApp API] Erro ao enviar mensagem:', error);
        return false;
      }
      
    } catch (error) {
      console.error('[WhatsApp API] Erro ao enviar mensagem:', error);
      return false;
    }
  }

  // Enviar mensagem com mídia
  async sendMediaMessage(to: string, mediaType: 'image' | 'video' | 'document', mediaUrl: string, caption?: string): Promise<boolean> {
    if (!this.config.businessApi || !this.isConnected) {
      throw new Error('WhatsApp Business API não está configurada ou conectada');
    }

    try {
      const { accessToken, phoneNumberId } = this.config.businessApi;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          ...(caption && { caption })
        }
      };

      const response = await fetch(`${this.baseUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[WhatsApp API] Mídia enviada:`, result);
        
        this.config.metrics.messagesSent++;
        this.config.metrics.lastActivity = new Date().toISOString();
        
        return true;
      } else {
        const error = await response.json();
        console.error('[WhatsApp API] Erro ao enviar mídia:', error);
        return false;
      }
      
    } catch (error) {
      console.error('[WhatsApp API] Erro ao enviar mídia:', error);
      return false;
    }
  }

  // Enviar mensagem interativa (botões)
  async sendInteractiveMessage(to: string, message: WhatsAppMessage): Promise<boolean> {
    if (!this.config.businessApi || !this.isConnected || !message.interactive) {
      throw new Error('WhatsApp Business API não está configurada ou mensagem inválida');
    }

    try {
      const { accessToken, phoneNumberId } = this.config.businessApi;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'interactive',
        interactive: message.interactive
      };

      const response = await fetch(`${this.baseUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[WhatsApp API] Mensagem interativa enviada:`, result);
        
        this.config.metrics.messagesSent++;
        this.config.metrics.lastActivity = new Date().toISOString();
        
        return true;
      } else {
        const error = await response.json();
        console.error('[WhatsApp API] Erro ao enviar mensagem interativa:', error);
        return false;
      }
      
    } catch (error) {
      console.error('[WhatsApp API] Erro ao enviar mensagem interativa:', error);
      return false;
    }
  }

  // Configurar webhook
  async setupWebhook(webhookUrl: string, verifyToken: string): Promise<boolean> {
    if (!this.config.businessApi) {
      return false;
    }

    try {
      const { accessToken, appId } = this.config.businessApi;
      
      const payload = {
        subscribed_fields: ['messages', 'message_deliveries', 'message_reads'],
        callback_url: webhookUrl,
        verify_token: verifyToken
      };

      const response = await fetch(`${this.baseUrl}/${appId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`[WhatsApp API] Webhook configurado para ${this.config.name}`);
        return true;
      } else {
        const error = await response.json();
        console.error('[WhatsApp API] Erro ao configurar webhook:', error);
        return false;
      }
      
    } catch (error) {
      console.error('[WhatsApp API] Erro ao configurar webhook:', error);
      return false;
    }
  }

  // Processar webhook recebido
  processWebhook(webhookData: any): WhatsAppMessage[] {
    const messages: WhatsAppMessage[] = [];

    try {
      if (webhookData.entry) {
        for (const entry of webhookData.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'messages' && change.value.messages) {
                for (const message of change.value.messages) {
                  const processedMessage: WhatsAppMessage = {
                    id: message.id,
                    from: message.from,
                    to: this.config.phone,
                    type: message.type,
                    timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                    text: message.text,
                    image: message.image,
                    video: message.video,
                    document: message.document,
                    interactive: message.interactive
                  };

                  messages.push(processedMessage);
                  
                  // Atualizar métricas
                  this.config.metrics.messagesReceived++;
                  this.config.metrics.lastActivity = new Date().toISOString();
                }
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('[WhatsApp API] Erro ao processar webhook:', error);
    }

    return messages;
  }

  // Obter status da conexão
  getStatus(): ConnectionStatus {
    return {
      id: this.connectionId,
      type: 'business_api',
      status: this.isConnected ? 'connected' : 'disconnected',
      lastCheck: new Date().toISOString(),
      errorMessage: this.isConnected ? undefined : 'API não configurada ou credenciais inválidas'
    };
  }

  // Verificar se está conectado
  isApiConnected(): boolean {
    return this.isConnected;
  }

  // Desconectar
  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log(`[WhatsApp API] Desconectado: ${this.config.name}`);
  }

  // Testar conexão
  async testConnection(): Promise<boolean> {
    return await this.validateCredentials();
  }
}