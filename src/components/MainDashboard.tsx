import React, { useState } from 'react';
import { LoginForm } from './auth/LoginForm';
import { MenuBuilder } from './menu/MenuBuilder';
import { AIServiceManager } from './ai/AIServiceManager';
import { CampaignBuilder } from './campaigns/CampaignBuilder';
import { LeadManager } from './leads/LeadManager';
import { 
  User, 
  Account, 
  WhatsAppNumber, 
  MenuItem, 
  AIConfig, 
  Campaign, 
  Lead,
  KnowledgeItem
} from '../types/system';

// Mock data inicial
const mockUser: User = {
  id: '1',
  name: 'Admin Demo',
  email: 'admin@demo.com',
  password_hash: 'hashed',
  role: 'admin_global',
  accounts_access: ['1'],
  created_at: new Date().toISOString(),
  is_active: true
};

const mockAccount: Account = {
  id: '1',
  name: 'Kohl Beauty Courses',
  owner_id: '1',
  plan: 'profissional',
  max_numbers: 3,
  created_at: new Date().toISOString(),
  is_active: true,
  settings: {
    timezone: 'America/Sao_Paulo',
    business_hours: {
      start: '09:00',
      end: '18:00',
      days: [1, 2, 3, 4, 5]
    },
    compliance: {
      lgpd_enabled: true,
      opt_in_required: true,
      data_retention_days: 365
    }
  }
};

const mockNumbers: WhatsAppNumber[] = [
  {
    id: '1',
    account_id: '1',
    name: 'Comercial',
    phone: '+55 11 99999-0001',
    connection_type: 'web',
    status: 'conectado',
    last_activity: new Date().toISOString(),
    settings: {
      welcome_message: '{{first_name}}, bem-vindo(a) à Kohl 👋\n\nSelecione o número do curso de seu interesse:',
      fallback_message: 'Desculpe, não entendi essa opção. Digite "menu" para ver as opções novamente.',
      business_hours_message: 'Nosso atendimento funciona de segunda a sexta, das 9h às 18h. Deixe sua mensagem!'
    }
  },
  {
    id: '2',
    account_id: '1',
    name: 'Suporte',
    phone: '+55 11 99999-0002',
    connection_type: 'api_oficial',
    status: 'conectado',
    last_activity: new Date().toISOString(),
    settings: {
      welcome_message: 'Olá! Sou o assistente de suporte da Kohl. Como posso ajudar?',
      fallback_message: 'Não entendi. Pode reformular sua pergunta?',
      business_hours_message: 'Suporte disponível 24/7. Como posso ajudar?'
    }
  }
];

const mockKnowledgeBase: KnowledgeItem[] = [
  {
    id: '1',
    type: 'faq',
    title: 'Quais são as formas de pagamento?',
    content: 'Aceitamos dinheiro, cartões de crédito (até 12x), PIX e transferências bancárias. Também oferecemos financiamento especial.',
    tags: ['pagamento', 'financiamento'],
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    type: 'faq',
    title: 'Preciso de experiência prévia?',
    content: 'Não é necessária experiência prévia. Nossos cursos começam do básico e progridem para técnicas avançadas.',
    tags: ['experiencia', 'pre-requisitos'],
    created_at: new Date().toISOString()
  }
];

const mockAIConfigs: AIConfig[] = [
  {
    id: '1',
    number_id: '1',
    openai_api_key: '',
    model: 'gpt-3.5-turbo',
    persona: {
      tone: 'cordial',
      instructions: 'Você é o assistente virtual da Kohl, especializada em cursos de beleza. Seja prestativo, profissional e sempre promova nossos cursos quando apropriado.',
      scope: ['Informações sobre cursos', 'Preços e formas de pagamento', 'Horários e agendamentos'],
      escalation_triggers: ['Reclamação ou feedback negativo', 'Pedido para falar com humano']
    },
    rag_config: {
      knowledge_base: mockKnowledgeBase,
      confidence_threshold: 0.7
    },
    settings: {
      max_tokens: 500,
      temperature: 0.7,
      timeout_seconds: 12
    }
  }
];

export function MainDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedAccount] = useState<Account>(mockAccount);
  const [selectedNumber, setSelectedNumber] = useState<WhatsAppNumber>(mockNumbers[0]);
  const [activeSection, setActiveSection] = useState('menu');
  
  // Estados dos dados
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>(mockAIConfigs);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const handleLogin = async (email: string, password: string) => {
    // Simulação de login
    if (email === 'admin@demo.com' && password === 'admin123') {
      setCurrentUser(mockUser);
    } else if (email === 'operador@demo.com' && password === 'operador123') {
      setCurrentUser({...mockUser, role: 'operador', name: 'Operador Demo'});
    } else {
      throw new Error('Credenciais inválidas');
    }
  };

  const menuSections = [
    { id: 'menu', label: 'Construtor de Menu', icon: '📋' },
    { id: 'ai', label: 'SAC com IA', icon: '🤖' },
    { id: 'campaigns', label: 'Campanhas & Fluxos', icon: '📢' },
    { id: 'leads', label: 'Gestão de Leads', icon: '👥' },
    { id: 'analytics', label: 'Relatórios', icon: '📊' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
  ];

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'menu':
        return (
          <MenuBuilder
            number={selectedNumber}
            items={menuItems.filter(item => item.number_id === selectedNumber.id)}
            onSave={(items) => {
              const otherItems = menuItems.filter(item => item.number_id !== selectedNumber.id);
              setMenuItems([...otherItems, ...items]);
            }}
          />
        );
      case 'ai':
        const aiConfig = aiConfigs.find(config => config.number_id === selectedNumber.id) || aiConfigs[0];
        return (
          <AIServiceManager
            number={selectedNumber}
            config={aiConfig}
            onSave={(config) => {
              setAiConfigs(aiConfigs.map(c => c.id === config.id ? config : c));
            }}
          />
        );
      case 'campaigns':
        return (
          <CampaignBuilder
            number={selectedNumber}
            campaigns={campaigns}
            leads={leads}
            onSave={setCampaigns}
          />
        );
      case 'leads':
        return (
          <LeadManager
            number={selectedNumber}
            leads={leads}
            onSave={setLeads}
          />
        );
      case 'analytics':
        return (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Relatórios em Desenvolvimento</h3>
            <p className="text-gray-600">Métricas e analytics serão implementados em breve</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações em Desenvolvimento</h3>
            <p className="text-gray-600">Configurações do sistema serão implementadas em breve</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Bot Manager</h1>
              <p className="text-gray-600">Sistema Completo de Automação</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Seletor de Número */}
            <select
              value={selectedNumber.id}
              onChange={(e) => {
                const number = mockNumbers.find(n => n.id === e.target.value);
                if (number) setSelectedNumber(number);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {mockNumbers.map((number) => (
                <option key={number.id} value={number.id}>
                  {number.name} ({number.phone})
                </option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistema Ativo</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">
                  {currentUser.name.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {menuSections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeSection === item.id 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-blue-800">Número Selecionado</span>
                </div>
                <p className="text-xs text-blue-700">{selectedNumber.name}</p>
                <p className="text-xs text-blue-600">{selectedNumber.phone}</p>
                <div className={`mt-2 px-2 py-1 rounded text-xs ${
                  selectedNumber.status === 'conectado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedNumber.status === 'conectado' ? 'Conectado' : 'Desconectado'}
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}