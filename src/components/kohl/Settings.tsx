import React, { useState } from 'react';
import { Save, Shield, Clock, Bell, Database, Webhook } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
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
      systemAlerts: true
    },
    integrations: {
      webhook: {
        url: '',
        secret: '',
        events: ['new_message', 'new_lead', 'campaign_sent']
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
    { id: 'general', label: 'Geral', icon: Clock },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'integrations', label: 'Integrações', icon: Webhook },
    { id: 'compliance', label: 'Conformidade', icon: Shield },
    { id: 'data', label: 'Gestão de Dados', icon: Database },
  ];

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // In real implementation, save to backend
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
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
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
                  Timezone
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
                  Business Hours
                </label>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Time</label>
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
                    <label className="block text-xs text-gray-600 mb-1">End Time</label>
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
                  <label className="block text-xs text-gray-600 mb-2">Working Days</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {key === 'newLeads' && 'Get notified when new leads are captured'}
                          {key === 'campaignResults' && 'Receive campaign performance summaries'}
                          {key === 'aiEscalations' && 'Alert when AI escalates to human agent'}
                          {key === 'systemAlerts' && 'Important system and security notifications'}
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Webhook Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
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
                      placeholder="https://your-app.com/webhook"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secret Key
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
                      placeholder="Your webhook secret"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">CRM Integration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CRM Type
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
                      <option value="none">None</option>
                      <option value="hubspot">HubSpot</option>
                      <option value="salesforce">Salesforce</option>
                      <option value="pipedrive">Pipedrive</option>
                      <option value="custom">Custom API</option>
                    </select>
                  </div>

                  {settings.integrations.crm.type !== 'none' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
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
                            API Endpoint
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
                            placeholder="https://api.your-crm.com/v1"
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
                  Your system is configured to comply with Brazilian data protection laws (LGPD).
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">GDPR/LGPD Compliance</h4>
                    <p className="text-sm text-gray-600">Enable data protection compliance features</p>
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
                    <h4 className="font-medium text-gray-900">Opt-in Required</h4>
                    <p className="text-sm text-gray-600">Require explicit consent before messaging</p>
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
                    Data Retention Period (days)
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
                    Unsubscribe Keyword
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
                    Users can send this keyword to stop receiving messages
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                    <h4 className="font-medium text-gray-900 mb-1">Export All Data</h4>
                    <p className="text-sm text-gray-600">Download complete database backup</p>
                  </button>
                  
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                    <h4 className="font-medium text-gray-900 mb-1">Export Leads</h4>
                    <p className="text-sm text-gray-600">Download leads data as CSV</p>
                  </button>
                  
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                    <h4 className="font-medium text-gray-900 mb-1">Export Messages</h4>
                    <p className="text-sm text-gray-600">Download message history</p>
                  </button>
                  
                  <button className="p-4 border border-red-200 rounded-lg hover:bg-red-50 text-left transition-colors">
                    <h4 className="font-medium text-red-900 mb-1">Delete Old Data</h4>
                    <p className="text-sm text-red-600">Remove data older than retention period</p>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Data Retention Policy</h4>
                <p className="text-sm text-yellow-700">
                  Data older than {settings.compliance.dataRetentionDays} days will be automatically deleted 
                  to comply with privacy regulations. Make sure to export important data before it's removed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}