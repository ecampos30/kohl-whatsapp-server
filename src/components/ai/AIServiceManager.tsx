import React, { useState } from 'react';
import { Brain, Save, TestTube, Upload, Trash2, Plus, Shield, AlertTriangle } from 'lucide-react';
import { AIConfig, KnowledgeItem, WhatsAppNumber } from '../../types/system';

interface AIServiceManagerProps {
  number: WhatsAppNumber;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
}

export function AIServiceManager({ number, config, onSave }: AIServiceManagerProps) {
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);
  const [activeTab, setActiveTab] = useState('persona');
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [newKnowledgeItem, setNewKnowledgeItem] = useState({
    type: 'faq' as const,
    title: '',
    content: '',
    url: '',
    tags: ''
  });

  const handleSave = () => {
    onSave(localConfig);
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) return;
    
    setIsTestingAI(true);
    setTestResponse('Testando resposta da IA...');
    
    // Simular chamada para OpenAI
    setTimeout(() => {
      const responses = [
        `Olá! Sou o assistente virtual da ${number.name}. Sobre "${testMessage}", posso te ajudar com informações sobre nossos cursos de beleza. Que tipo de curso você tem interesse?`,
        `Entendi sua pergunta sobre "${testMessage}". Com base no nosso conhecimento, posso te orientar sobre procedimentos, preços e agendamentos. Como posso ajudar especificamente?`,
        `Obrigado por perguntar sobre "${testMessage}". Tenho informações completas sobre nossos cursos e posso esclarecer suas dúvidas. Gostaria de saber mais sobre algum curso específico?`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setTestResponse(randomResponse);
      setIsTestingAI(false);
    }, 2000);
  };

  const addKnowledgeItem = () => {
    if (!newKnowledgeItem.title || !newKnowledgeItem.content) {
      alert('Por favor, preencha título e conteúdo');
      return;
    }

    const item: KnowledgeItem = {
      id: Date.now().toString(),
      type: newKnowledgeItem.type,
      title: newKnowledgeItem.title,
      content: newKnowledgeItem.content,
      url: newKnowledgeItem.url || undefined,
      tags: newKnowledgeItem.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      created_at: new Date().toISOString()
    };

    setLocalConfig({
      ...localConfig,
      rag_config: {
        ...localConfig.rag_config,
        knowledge_base: [...localConfig.rag_config.knowledge_base, item]
      }
    });

    setNewKnowledgeItem({
      type: 'faq',
      title: '',
      content: '',
      url: '',
      tags: ''
    });
  };

  const removeKnowledgeItem = (id: string) => {
    setLocalConfig({
      ...localConfig,
      rag_config: {
        ...localConfig.rag_config,
        knowledge_base: localConfig.rag_config.knowledge_base.filter(item => item.id !== id)
      }
    });
  };

  const tabs = [
    { id: 'persona', label: 'Persona da IA', icon: Brain },
    { id: 'scope', label: 'Escopo e Limites', icon: Shield },
    { id: 'knowledge', label: 'Base de Conhecimento', icon: Upload },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">SAC com IA</h2>
          <p className="text-gray-600">Configure o assistente virtual para {number.name} ({number.phone})</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>IA Ativa</span>
          </div>
          
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
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
          {activeTab === 'persona' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave da API OpenAI
                  </label>
                  <input
                    type="password"
                    value={localConfig.openai_api_key}
                    onChange={(e) => setLocalConfig({...localConfig, openai_api_key: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sua chave é armazenada de forma segura e criptografada
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo
                    </label>
                    <select
                      value={localConfig.model}
                      onChange={(e) => setLocalConfig({...localConfig, model: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido)</option>
                      <option value="gpt-4">GPT-4 (Preciso)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (Avançado)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tom de Voz
                    </label>
                    <select
                      value={localConfig.persona.tone}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        persona: {...localConfig.persona, tone: e.target.value as any}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cordial">Cordial</option>
                      <option value="objetivo">Objetivo</option>
                      <option value="acolhedor">Acolhedor</option>
                      <option value="profissional">Profissional</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instruções Personalizadas
                  </label>
                  <textarea
                    value={localConfig.persona.instructions}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      persona: {...localConfig.persona, instructions: e.target.value}
                    })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Você é o assistente virtual especializado em cursos de beleza. Seja prestativo, profissional e sempre promova nossos cursos quando apropriado..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máx. Tokens
                    </label>
                    <input
                      type="number"
                      value={localConfig.settings.max_tokens}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        settings: {...localConfig.settings, max_tokens: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={localConfig.settings.temperature}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        settings: {...localConfig.settings, temperature: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout (s)
                    </label>
                    <input
                      type="number"
                      value={localConfig.settings.timeout_seconds}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        settings: {...localConfig.settings, timeout_seconds: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Testar Assistente de IA</h3>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Pergunte sobre cursos, preços, horários..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <button
                      onClick={handleTestAI}
                      disabled={isTestingAI || !testMessage.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                    >
                      <TestTube className="h-4 w-4" />
                      <span>{isTestingAI ? 'Testando...' : 'Testar Resposta'}</span>
                    </button>
                    
                    {testResponse && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{testResponse}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Configuração Atual</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p><strong>Tom:</strong> {localConfig.persona.tone}</p>
                    <p><strong>Modelo:</strong> {localConfig.model}</p>
                    <p><strong>Máx. Resposta:</strong> {localConfig.settings.max_tokens} tokens</p>
                    <p><strong>Confiança Mín.:</strong> {(localConfig.rag_config.confidence_threshold * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scope' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tópicos que a IA Pode Atender</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Informações sobre cursos',
                    'Preços e formas de pagamento',
                    'Horários e agendamentos',
                    'Pré-requisitos dos cursos',
                    'Materiais inclusos',
                    'Certificação',
                    'Localização e direções',
                    'Suporte geral',
                    'Processo de matrícula'
                  ].map((topic) => (
                    <label key={topic} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localConfig.persona.scope.includes(topic)}
                        onChange={(e) => {
                          const newScope = e.target.checked
                            ? [...localConfig.persona.scope, topic]
                            : localConfig.persona.scope.filter(t => t !== topic);
                          setLocalConfig({
                            ...localConfig,
                            persona: {...localConfig.persona, scope: newScope}
                          });
                        }}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm text-gray-700">{topic}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gatilhos para Handoff Humano</h3>
                <div className="space-y-3">
                  {[
                    'Reclamação ou feedback negativo',
                    'Solicitações de estorno',
                    'Problemas técnicos',
                    'Conflitos de agendamento complexos',
                    'Questões médicas ou de saúde',
                    'Pedido para falar com humano',
                    'Negociações de preço',
                    'Linguagem ofensiva ou agressiva',
                    'Confiança baixa na resposta (< 70%)'
                  ].map((trigger) => (
                    <label key={trigger} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localConfig.persona.escalation_triggers.includes(trigger)}
                        onChange={(e) => {
                          const newTriggers = e.target.checked
                            ? [...localConfig.persona.escalation_triggers, trigger]
                            : localConfig.persona.escalation_triggers.filter(t => t !== trigger);
                          setLocalConfig({
                            ...localConfig,
                            persona: {...localConfig.persona, escalation_triggers: newTriggers}
                          });
                        }}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm text-gray-700">{trigger}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Regras de Handoff</span>
                </div>
                <div className="text-sm text-orange-700 space-y-1">
                  <p>• Quando ativado, a conversa é transferida para um atendente humano</p>
                  <p>• O cliente recebe: "Encaminhei ao atendente. Já te respondemos por aqui. 🙏"</p>
                  <p>• Notificação é enviada via painel, email ou WhatsApp interno</p>
                  <p>• Histórico da conversa é preservado para contexto</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Base de Conhecimento RAG</h3>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Adicionar Novo Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <select
                        value={newKnowledgeItem.type}
                        onChange={(e) => setNewKnowledgeItem({...newKnowledgeItem, type: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="faq">FAQ</option>
                        <option value="text">Texto</option>
                        <option value="url">URL/Link</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Título"
                        value={newKnowledgeItem.title}
                        onChange={(e) => setNewKnowledgeItem({...newKnowledgeItem, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {newKnowledgeItem.type === 'url' && (
                      <div className="md:col-span-2">
                        <input
                          type="url"
                          placeholder="URL do conteúdo"
                          value={newKnowledgeItem.url}
                          onChange={(e) => setNewKnowledgeItem({...newKnowledgeItem, url: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    
                    <div className="md:col-span-2">
                      <textarea
                        placeholder="Conteúdo ou descrição"
                        value={newKnowledgeItem.content}
                        onChange={(e) => setNewKnowledgeItem({...newKnowledgeItem, content: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        placeholder="Tags (separadas por vírgula)"
                        value={newKnowledgeItem.tags}
                        onChange={(e) => setNewKnowledgeItem({...newKnowledgeItem, tags: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={addKnowledgeItem}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {localConfig.rag_config.knowledge_base.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              item.type === 'faq' ? 'bg-blue-100 text-blue-800' :
                              item.type === 'pdf' ? 'bg-red-100 text-red-800' :
                              item.type === 'url' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.type.toUpperCase()}
                            </span>
                            <h5 className="font-medium text-gray-900">{item.title}</h5>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.content}</p>
                          
                          {item.url && (
                            <p className="text-xs text-blue-600 mb-2">
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {item.url}
                              </a>
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeKnowledgeItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {localConfig.rag_config.knowledge_base.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum item na base de conhecimento ainda</p>
                      <p className="text-sm">Adicione FAQs, documentos ou links para melhorar as respostas da IA</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Como Funciona o RAG</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• A IA busca informações relevantes na base de conhecimento</p>
                  <p>• Usa busca semântica para encontrar conteúdo relacionado</p>
                  <p>• Combina o conhecimento com a pergunta do cliente</p>
                  <p>• Sempre cita a fonte quando usar informações da base</p>
                  <p>• Confiança mínima: {(localConfig.rag_config.confidence_threshold * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}