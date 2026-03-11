import React, { useState, useEffect } from 'react';
import {
  Smartphone, Bot, LayoutList, Megaphone, MessageSquare, Users,
  BarChart2, Activity, Settings as SettingsIcon, ChevronRight,
} from 'lucide-react';
import { WhatsAppConnections } from './WhatsAppConnections';
import { AIConfiguration } from './AIConfiguration';
import { MenuBuilder } from './MenuBuilder';
import { CampaignManager } from './CampaignManager';
import { LeadManager } from './LeadManager';
import { Analytics } from './Analytics';
import { Settings } from '../ui/admin/Settings';
import { SystemStatus } from './SystemStatus';
import { MessageTemplates } from './MessageTemplates';
import { WhatsAppConnection, AIConfiguration as AIConfig, MenuTemplate, Campaign, Lead } from '../../types/kohl-system';
import { defaultMenuTemplate, kohlFAQs } from '../../data/kohl-courses';
import { startSession as startWebSession } from '../../integrations/whatsapp/webSession';
import { logger } from '../../lib/logger';
import { supabase } from '../../lib/supabase';
import { SectionErrorBoundary } from '../ui/StateViews';

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
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(
    () => localStorage.getItem('kohl_selected_connection') ?? connections[0]?.id ?? ''
  );

  const handleSelectConnection = (id: string) => {
    setSelectedConnectionId(id);
    localStorage.setItem('kohl_selected_connection', id);
  };

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
    { id: 'connections', label: 'Conexões WhatsApp', icon: Smartphone },
    { id: 'ai', label: 'Configuração de IA', icon: Bot },
    { id: 'menu', label: 'Construtor de Menu', icon: LayoutList },
    { id: 'campaigns', label: 'Campanhas e Fluxos', icon: Megaphone },
    { id: 'templates', label: 'Templates de Msg', icon: MessageSquare },
    { id: 'leads', label: 'Gestão de Leads', icon: Users },
    { id: 'analytics', label: 'Relatórios', icon: BarChart2 },
    { id: 'status', label: 'Status do Sistema', icon: Activity },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
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
    const label = menuItems.find(m => m.id === activeSection)?.label ?? activeSection;

    const wrap = (node: React.ReactNode) => (
      <SectionErrorBoundary sectionName={label} onRetry={() => setActiveSection(activeSection)}>
        {node}
      </SectionErrorBoundary>
    );

    switch (activeSection) {
      case 'connections':
        return wrap(
          <WhatsAppConnections
            connections={connections}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
            onConfigureConnection={handleConfigureConnection}
            clientId={authClientId}
          />
        );
      case 'ai':
        return wrap(
          <AIConfiguration
            config={aiConfigs[0]}
            onSave={handleSaveAIConfig}
            connectionId={selectedConnectionId || connections[0]?.id}
            clientId={authClientId}
          />
        );
      case 'menu':
        return wrap(
          <MenuBuilder
            menu={menus[0]}
            onSave={handleSaveMenu}
          />
        );
      case 'campaigns':
        return wrap(
          <CampaignManager
            campaigns={campaigns}
            connections={connections}
            onSave={setCampaigns}
          />
        );
      case 'templates':
        return wrap(<MessageTemplates />);
      case 'leads':
        return wrap(
          <LeadManager
            leads={leads}
            connections={connections}
            onSave={setLeads}
          />
        );
      case 'analytics':
        return wrap(<Analytics connections={connections} />);
      case 'status':
        return wrap(
          <SystemStatus
            clientId={authClientId}
            connectionId={selectedConnectionId || connections[0]?.id}
          />
        );
      case 'settings':
        return wrap(
          <Settings
            connections={[]}
            onSave={() => {}}
            kohlConnections={connections}
            selectedConnectionId={selectedConnectionId}
            onSelectConnection={handleSelectConnection}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-gray-500">Secao nao encontrada</p>
          </div>
        );
    }
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const activeItem = menuItems.find(m => m.id === activeSection);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-5 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm tracking-tight">K</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-semibold text-gray-900">Kohl Bot Manager</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Connection status pill */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            connectedCount > 0
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connectedCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            {connectedCount}/{connections.length} online
          </div>

          {/* Type split */}
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 border-l border-gray-200 pl-2">
            <span>{connections.filter(c => c.connectionType === 'web').length} Web</span>
            <span>·</span>
            <span>{connections.filter(c => c.connectionType === 'api').length} API</span>
          </div>

          {/* Active session pill */}
          {selectedConnectionId && (
            <button
              onClick={() => setActiveSection('settings')}
              className="hidden lg:inline-flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200"
              title="Clique para trocar a sessao ativa"
            >
              <Smartphone className="h-3 w-3 text-gray-400" />
              <span className="text-gray-500">Enviando via</span>
              <span className="font-semibold text-gray-800">
                {connections.find(c => c.id === selectedConnectionId)?.name ?? selectedConnectionId}
              </span>
            </button>
          )}

          {/* Avatar */}
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center ml-1">
            <span className="text-gray-600 text-xs font-semibold">A</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 shrink-0 flex flex-col">
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                    isActive
                      ? 'bg-rose-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="font-medium truncate">{item.label}</span>
                  {isActive && <ChevronRight className="h-3 w-3 ml-auto shrink-0 opacity-70" />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-3 py-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 leading-tight">Kohl Bot Manager</p>
            <p className="text-[10px] text-gray-300">Sistema de Gerenciamento</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Breadcrumb bar */}
          <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-2 text-xs text-gray-400">
            <span>Painel</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-medium">{activeItem?.label ?? 'Secao'}</span>
          </div>
          <div className="p-6">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}