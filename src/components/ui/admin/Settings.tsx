import React, { useState } from 'react';
import { Save, Shield, Clock, Bell, Database, Webhook, Key, Globe, QrCode, Smartphone } from 'lucide-react';
import { WhatsAppConnectionConfig } from '../../config/connections';
import { SessionSelector } from '../../kohl/SessionSelector';
import { WhatsAppConnection } from '../../types/kohl-system';

interface SettingsProps {
  connections: WhatsAppConnectionConfig[];
  onSave: (connections: WhatsAppConnectionConfig[]) => void;
  kohlConnections?: WhatsAppConnection[];
  selectedConnectionId?: string;
  onSelectConnection?: (id: string) => void;
}

export function Settings({ connections, onSave, kohlConnections, selectedConnectionId, onSelectConnection }: SettingsProps) {
  const [activeTab, setActiveTab] = useState(kohlConnections ? 'session' : 'whatsapp');
  const [settings, setSettings] = useState({
    whatsapp: {
      fallbackMode: 'auto_fallback' as 'web_only' | 'api_only' | 'auto_fallback',
      defaultConnectionType: 'web' as 'web' | 'business_api',
      qrCodeTimeout: 60,
      apiTimeout: 30,
      retryAttempts: 3
    },
    businessInfo: {
      name: 'Kohl Beauty Courses',
      timezone: 'America/Sao_Paulo',
      businessHours: {
        start: '09:00',
        end: '18:00',
        days: [1, 2, 3, 4, 5] // Monday to Friday
      }
    },
    notifications: {
      newLeads: true,
      campaignResults: true,
      aiEscalations: true,
      systemAlerts: true,
      connectionIssues: true
    },
    integrations: {
      webhook: {
        url: '',
        secret: '',
        events: ['new_message', 'new_lead', 'campaign_sent', 'connection_status']
      },
      crm: {
        type: 'none',
        apiKey: '',
        endpoint: ''
      }
    },
    compliance: {
      gdprEnabled: true,
      dataRetentionDays: 365,
      optInRequired: true,
      unsubscribeKeyword: 'PARAR'
    }
  });

  const tabs = [
    ...(kohlConnections ? [{ id: 'session', label: 'Sessao Ativa', icon: Smartphone }] : []),
    { id: 'whatsapp', label: 'WhatsApp', icon: QrCode },
    { id: 'general', label: 'Geral', icon: Clock },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'integrations', label: 'Integrações', icon: Webhook },
    { id: 'compliance', label: 'Conformidade', icon: Shield },
    { id: 'data', label: 'Gestão de Dados', icon: Database },
  ];

  const handleSave = () => {
    console.log('Salvando configurações:', settings);
    // Em implementação real, salvar no backend
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configurações do Sistema</h2>
          <p className="text-gray-600">Configure seu Gerenciador de Bot WhatsApp</p>
        </div>
        
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'session' && kohlConnections && onSelectConnection && selectedConnectionId !== undefined && (
            <SessionSelector
              connections={kohlConnections}
              selectedConnectionId={selectedConnectionId}
              onSelect={onSelectConnection}
            />
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">🔄 Sistema Dual WhatsApp</h3>
                <p className="text-sm text-blue-700">
                  O sistema suporta tanto WhatsApp Web (QR Code) quanto WhatsApp Business API oficial. 
                  Configure o modo de fallback para garantir máxima disponibilidade.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modo de Conexão Padrão
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="defaultConnection"
                      value="web"
                      checked={settings.whatsapp.defaultConnectionType === 'web'}
                      onChange={(e) => setSettings({
                        ...settings,
                        whatsapp: { ...settings.whatsapp, defaultConnectionType: e.target.value as any }
                      })}
                      className="mr-3"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-900">WhatsApp Web</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Conexão via QR Code (gratuito, mais simples)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="defaultConnection"
                      value="business_api"
                      checked={settings.whatsapp.defaultConnectionType === 'business_api'}
                      onChange={(e) => setSettings({
                        ...settings,
                        whatsapp: { ...settings.whatsapp, defaultConnectionType: e.target.value as any }
                      })}
                      className="mr-3"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Key className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Business API</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        API oficial (pago, mais recursos)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estratégia de Fallback
                </label>
                <select
                  value={settings.whatsapp.fallbackMode}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, fallbackMode: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="auto_fallback">Auto Fallback (Recomendado)</option>
                  <option value="web_only">Apenas WhatsApp Web</option>
                  <option value="api_only">Apenas Business API</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Auto Fallback: se API falhar, usa Web QR automaticamente
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout QR Code (s)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={settings.whatsapp.qrCodeTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, qrCodeTimeout: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout API (s)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={settings.whatsapp.apiTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, apiTimeout: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tentativas de Reconexão
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.whatsapp.retryAttempts}
                    onChange={(e) => setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, retryAttempts: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Importante</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• <strong>WhatsApp Web:</strong> Gratuito, mas requer celular sempre conectado</p>
                  <p>• <strong>Business API:</strong> Pago, mas mais estável e com recursos avançados</p>
                  <p>• <strong>Auto Fallback:</strong> Garante que sempre haverá uma conexão ativa</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Negócio
                </label>
                <input
                  type="text"
                  value={settings.businessInfo.name}
                  onChange={(e) => setSettings({
                    ...settings,
                    businessInfo: { ...settings.businessInfo, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuso Horário
                </label>
                <select
                  value={settings.businessInfo.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    businessInfo: { ...settings.businessInfo, timezone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Horário Comercial
                </label>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Início</label>
                    <input
                      type="time"
                      value={settings.businessInfo.businessHours.start}
                      onChange={(e) => setSettings({
                        ...settings,
                        businessInfo: {
                          ...settings.businessInfo,
                          businessHours: { ...settings.businessInfo.businessHours, start: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fim</label>
                    <input
                      type="time"
                      value={settings.businessInfo.businessHours.end}
                      onChange={(e) => setSettings({
                        ...settings,
                        businessInfo: {
                          ...settings.businessInfo,
                          businessHours: { ...settings.businessInfo.businessHours, end: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">Dias de Funcionamento</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                      <label key={index} className="flex flex-col items-center">
                        <input
                          type="checkbox"
                          checked={settings.businessInfo.businessHours.days.includes(index)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...settings.businessInfo.businessHours.days, index]
                              : settings.businessInfo.businessHours.days.filter(d => d !== index);
                            setSettings({
                              ...settings,
                              businessInfo: {
                                ...settings.businessInfo,
                                businessHours: { ...settings.businessInfo.businessHours, days: newDays }
                              }
                            });
                          }}
                          className="mb-1"
                        />
                        <span className="text-xs text-gray-600">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notificações por Email</h3>
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">
                          {key === 'newLeads' && 'Novos Leads'}
                          {key === 'campaignResults' && 'Resultados de Campanhas'}
                          {key === 'aiEscalations' && 'Escalações da IA'}
                          {key === 'systemAlerts' && 'Alertas do Sistema'}
                          {key === 'connectionIssues' && 'Problemas de Conexão'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {key === 'newLeads' && 'Notificar quando novos leads forem capturados'}
                          {key === 'campaignResults' && 'Receber resumos de performance das campanhas'}
                          {key === 'aiEscalations' && 'Alertar quando IA escalar para atendente humano'}
                          {key === 'systemAlerts' && 'Notificações importantes do sistema e segurança'}
                          {key === 'connectionIssues' && 'Alertar sobre problemas nas conexões WhatsApp'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, [key]: e.target.checked }
                        })}
                        className="rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuração de Webhook</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL do Webhook
                    </label>
                    <input
                      type="url"
                      value={settings.integrations.webhook.url}
                      onChange={(e) => setSettings({
                        ...settings,
                        integrations: {
                          ...settings.integrations,
                          webhook: { ...settings.integrations.webhook, url: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://seu-app.com/webhook"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chave Secreta
                    </label>
                    <input
                      type="password"
                      value={settings.integrations.webhook.secret}
                      onChange={(e) => setSettings({
                        ...settings,
                        integrations: {
                          ...settings.integrations,
                          webhook: { ...settings.integrations.webhook, secret: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Sua chave secreta do webhook"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Integração CRM</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de CRM
                    </label>
                    <select
                      value={settings.integrations.crm.type}
                      onChange={(e) => setSettings({
                        ...settings,
                        integrations: {
                          ...settings.integrations,
                          crm: { ...settings.integrations.crm, type: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="none">Nenhum</option>
                      <option value="hubspot">HubSpot</option>
                      <option value="salesforce">Salesforce</option>
                      <option value="pipedrive">Pipedrive</option>
                      <option value="custom">API Personalizada</option>
                    </select>
                  </div>

                  {settings.integrations.crm.type !== 'none' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chave da API
                        </label>
                        <input
                          type="password"
                          value={settings.integrations.crm.apiKey}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              crm: { ...settings.integrations.crm, apiKey: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {settings.integrations.crm.type === 'custom' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Endpoint da API
                          </label>
                          <input
                            type="url"
                            value={settings.integrations.crm.endpoint}
                            onChange={(e) => setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                crm: { ...settings.integrations.crm, endpoint: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://api.seu-crm.com/v1"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">LGPD Compliance</h3>
                <p className="text-sm text-green-700">
                  Seu sistema está configurado para compliance com as leis brasileiras de proteção de dados (LGPD).
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">GDPR/LGPD Compliance</h4>
                    <p className="text-sm text-gray-600">Habilitar recursos de proteção de dados</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compliance.gdprEnabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      compliance: { ...settings.compliance, gdprEnabled: e.target.checked }
                    })}
                    className="rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Opt-in Obrigatório</h4>
                    <p className="text-sm text-gray-600">Exigir consentimento explícito antes de enviar mensagens</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compliance.optInRequired}
                    onChange={(e) => setSettings({
                      ...settings,
                      compliance: { ...settings.compliance, optInRequired: e.target.checked }
                    })}
                    className="rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período de Retenção de Dados (dias)
                  </label>
                  <input
                    type="number"
                    value={settings.compliance.dataRetentionDays}
                    onChange={(e) => setSettings({
                      ...settings,
                      compliance: { ...settings.compliance, dataRetentionDays: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Palavra-chave para Descadastro
                  </label>
                  <input
                    type="text"
                    value={settings.compliance.unsubscribeKeyword}
                    onChange={(e) => setSettings({
                      ...settings,
                      compliance: { ...settings.compliance, unsubscribeKeyword: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usuários podem enviar esta palavra para parar de receber mensagens
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gestão de Dados</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                    <h4 className="font-medium text-gray-900 mb-1">Exportar Todos os Dados</h4>
                    <p className="text-sm text-gray-600">Download completo do backup do banco de dados</p>
                  </button>
                  
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                    <h4 className="font-medium text-gray-900 mb-1">Exportar Leads</h4>
                    <p className="text-sm text-gray-600">Download dos dados de leads como CSV</p>
                  </button>
                  
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                    <h4 className="font-medium text-gray-900 mb-1">Exportar Mensagens</h4>
                    <p className="text-sm text-gray-600">Download do histórico de mensagens</p>
                  </button>
                  
                  <button className="p-4 border border-red-200 rounded-lg hover:bg-red-50 text-left transition-colors">
                    <h4 className="font-medium text-red-900 mb-1">Excluir Dados Antigos</h4>
                    <p className="text-sm text-red-600">Remover dados mais antigos que o período de retenção</p>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Política de Retenção de Dados</h4>
                <p className="text-sm text-yellow-700">
                  Dados com mais de {settings.compliance.dataRetentionDays} dias serão automaticamente excluídos 
                  para compliance com regulamentações de privacidade. Certifique-se de exportar dados importantes antes da remoção.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}