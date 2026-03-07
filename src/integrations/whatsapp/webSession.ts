import { WhatsAppConnectionConfig, WhatsAppMessage, ConnectionStatus } from '../../config/connections';

export class WhatsAppWebSession {
  private connectionId: string;
  private config: WhatsAppConnectionConfig;
  private qrCode: string | null = null;
  private isConnected: boolean = false;

  constructor(connectionId: string, config: WhatsAppConnectionConfig) {
    this.connectionId = connectionId;
    this.config = config;
  }

  async startSession(): Promise<void> {
    throw new Error(
      'WhatsApp Web QR requer um servidor Node.js externo com Baileys rodando 24/7. ' +
      'Esta funcionalidade está pendente de integração com backend externo. ' +
      'Use a WhatsApp Business API (tipo "api_oficial") para conexão funcional neste ambiente.'
    );
  }

  async sendMessage(_to: string, _message: WhatsAppMessage): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('WhatsApp Web não está conectado. Requer servidor Baileys externo.');
    }
    return false;
  }

  onMessageReceived(_callback: (message: WhatsAppMessage) => void): void {
    console.warn('[WhatsApp Web] Recebimento de mensagens requer servidor Baileys externo. Nenhum listener ativado.');
  }

  getStatus(): ConnectionStatus {
    return {
      id: this.connectionId,
      type: 'web',
      status: this.isConnected ? 'connected' : (this.qrCode ? 'scanning' : 'disconnected'),
      lastCheck: new Date().toISOString(),
      qrCode: this.qrCode || undefined
    };
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.qrCode = null;
    console.log(`[WhatsApp Web] Sessão encerrada: ${this.config.name}`);
  }

  isSessionActive(): boolean {
    return this.isConnected;
  }

  async clearSession(): Promise<void> {
    await this.disconnect();
  }
}
