import React, { useState, useEffect } from 'react';
import { WhatsAppConnections } from './WhatsAppConnections';
import { AIConfiguration } from './AIConfiguration';
import { MenuBuilder } from './MenuBuilder';
import { CampaignManager } from './CampaignManager';
import { LeadManager } from './LeadManager';
import { Analytics } from './Analytics';
import { Settings } from '../ui/admin/Settings';
import { SystemStatus } from './SystemStatus';
import { WhatsAppConnection, AIConfiguration as AIConfig, MenuTemplate, Campaign, Lead } from '../../types/kohl-system';
import { defaultMenuTemplate, kohlFAQs } from '../../data/kohl-courses';
import { startSession as startWebSession } from '../../integrations/whatsapp/webSession';
import { logger } from '../../lib/logger';
import { supabase } from '../../lib/supabase';

export function KohlDashboard() {
  const [activeSection, setActiveSection] = useState('connections');
  const [authClientId, setAuthClientId] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        setAuthClientId(data.user.id);
      }
    });
  }, []);
  const [connections, setConnections] = useState<WhatsAppConnection[]>([
    {
      id: '1',
      name: 'Kohl Comercial',
      number: '+55 11 99999-0001',
      status: 'disconnected',
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      connectionType: 'web',
      apiCredentials: undefined
    },
    {
      id: '2',
      name: 'Kohl Suporte',
      number: '+55 11 99999-0002',
      status: 'disconnected',
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      connectionType: 'api',
      apiCredentials: {
        accessToken: 'EAA_demo_token_123',
        phoneNumberId: '987654321',
        businessAccountId: '123456789'
      }
    }
  ]);

  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([
    {
      id: '1',
      whatsappId: '1',
      openaiApiKey: '',
      model: 'gpt-3.5-turbo',
      persona: {
        tone: 'welcoming',
        language: 'pt-BR',
        customInstructions: 'You are Kohl\'s AI assistant for beauty courses. Be helpful, professional, and always promote our courses when appropriate. Focus on eyebrow techniques, microblading, and beauty treatments.'
      },
      scope: {
        canHandle: ['Course Information', 'Pricing & Payment', 'Schedule & Dates'],
        escalationTriggers: ['Complaint or negative feedback', 'Request to speak with human'],
        maxTokens: 500,
        temperature: 0.7
      },
      ragKnowledgeBase: {
        faqs: kohlFAQs,
        documents: [],
        courseInfo: []
      }
    }
  ]);

  const [menus, setMenus] = useState<MenuTemplate[]>([
    { ...defaultMenuTemplate, whatsappId: '1' }
  ]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Simular algumas conexões para demonstração
  useEffect(() => {
    // Simular mudanças de status das conexões
    const interval = setInterval(() => {
      setConnections(prevConnections => 
        prevConnections.map(conn => {
          // Simular atividade aleatória
          if (Math.random() > 0.95) {
            return {
              ...conn,
              messageCount: conn.messageCount + Math.floor(Math.random() * 3),
              lastActivity: new Date().toISOString()
            };
          }
          return conn;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'connections', label: 'Conexões WhatsApp', icon: '📱' },
    { id: 'ai', label: 'Configuração de IA', icon: '🤖' },
    { id: 'menu', label: 'Construtor de Menu', icon: '📋' },
    { id: 'campaigns', label: 'Campanhas e Fluxos', icon: '📢' },
    { id: 'leads', label: 'Gestão de Leads', icon: '👥' },
    { id: 'analytics', label: 'Relatórios', icon: '📊' },
    { id: 'status', label: 'Status do Sistema', icon: '🔍' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
  ];

  const handleAddConnection = () => {
    const newConnection: WhatsAppConnection = {
      id: Date.now().toString(),
      name: `Kohl ${connections.length + 1}`,
      number: `+55 11 99999-000${connections.length + 1}`,
      status: 'disconnected',
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      connectionType: connections.length % 2 === 0 ? 'web' : 'api',
      apiCredentials: connections.length % 2 === 1 ? {
        access_token: '',
        phone_number_id: '',
        business_account_id: ''
      } : undefined
    };
    setConnections([...connections, newConnection]);
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(connections.filter(conn => conn.id !== id));
  };

  const handleConfigureConnection = async (id: string) => {
    const connection = connections.find(conn => conn.id === id);
    if (!connection) return;

    await logger.info('connection_configure', `Configurando conexão ${connection.name} (${connection.connectionType})`, { id });

    try {
      setConnections(prev => prev.map(conn =>
        conn.id === id
          ? { ...conn, status: connection.connectionType === 'web' ? 'scanning' : 'disconnected' }
          : conn
      ));

      if (connection.connectionType === 'web') {
        const res = await startWebSession(id);
        if (res.ok) {
          await logger.info('qr_generated', `Sessao web iniciada para conexão ${connection.name}`, { id });
        } else {
          await logger.info('session_start_failed', `Falha ao iniciar sessao web: ${res.error}`, { id });
        }

      } else if (connection.connectionType === 'api') {
        await logger.info('api_validate', `Iniciando validação Business API para ${connection.name}`, { id });
        await new Promise(resolve => setTimeout(resolve, 2000));
        const isValid = !!connection.apiCredentials?.accessToken;

        if (isValid) {
          setConnections(prev => prev.map(conn => conn.id === id ? { ...conn, status: 'connected' } : conn));
          await logger.info('session_connected', `Business API validada com sucesso para ${connection.name}`, { id });
        } else {
          setConnections(prev => prev.map(conn => conn.id === id ? { ...conn, status: 'error' } : conn));
          await logger.error('session_error', `Falha na validação da API para ${connection.name}`, { id });
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await logger.error('session_error', `Erro ao configurar conexão: ${msg}`, { id });
      setConnections(prev => prev.map(conn => conn.id === id ? { ...conn, status: 'error' } : conn));
    }
  };

  const handleSaveAIConfig = (config: AIConfig) => {
    setAiConfigs(aiConfigs.map(c => c.id === config.id ? config : c));
  };

  const handleSaveMenu = (menu: MenuTemplate) => {
    setMenus(menus.map(m => m.id === menu.id ? menu : m));
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'connections':
        return (
          <WhatsAppConnections
            connections={connections}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
            onConfigureConnection={handleConfigureConnection}
            clientId={authClientId}
          />
        );
      case 'ai':
        return (
          <AIConfiguration
            config={aiConfigs[0]}
            onSave={handleSaveAIConfig}
            connectionId={connections[0]?.id}
            clientId={authClientId}
          />
        );
      case 'menu':
        return (
          <MenuBuilder
            menu={menus[0]}
            onSave={handleSaveMenu}
          />
        );
      case 'campaigns':
        return (
          <CampaignManager
            campaigns={campaigns}
            connections={connections}
            onSave={setCampaigns}
          />
        );
      case 'leads':
        return (
          <LeadManager
            leads={leads}
            connections={connections}
            onSave={setLeads}
          />
        );
      case 'analytics':
        return (
          <Analytics
            connections={connections}
          />
        );
      case 'status':
        return (
          <SystemStatus
            clientId={authClientId}
            connectionId={connections[0]?.id}
          />
        );
      case 'settings':
        return (
          <Settings
            connections={connections}
            onSave={setConnections}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kohl Bot Manager</h1>
              <p className="text-gray-600">Sistema de Gerenciamento WhatsApp para Cursos de Beleza</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>
                {connections.filter(c => c.status === 'connected').length} de {connections.length} Conectado(s)
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              {connections.filter(c => c.connectionType === 'web').length} Web QR • {' '}
              {connections.filter(c => c.connectionType === 'api').length} Business API
            </div>
            
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">A</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeSection === item.id 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}