import React, { useState } from 'react';
import { Save, TestTube, Brain, Shield, Plus, Trash2, Upload, AlertTriangle, CheckCircle, HelpCircle, Key, Loader } from 'lucide-react';
import { SaveToast } from '../ui/StateViews';
import { AIConfiguration as AIConfigType, FAQ, Document } from '../../types/kohl-system';
import { supabase } from '../../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface AIConfigurationProps {
  config: AIConfigType;
  onSave: (config: AIConfigType) => void;
  connectionId?: string;
  clientId?: string;
}

type KeyTestStatus = 'idle' | 'testing' | 'ok' | 'invalid_key' | 'quota_exceeded' | 'not_configured' | 'error';

export function AIConfiguration({ config, onSave, connectionId, clientId }: AIConfigurationProps) {
  const [activeTab, setActiveTab] = useState('persona');
  const [localConfig, setLocalConfig] = useState(config);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '', category: '', tags: '' });
  const [newApiKey, setNewApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveResult, setKeySaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [keyTestStatus, setKeyTestStatus] = useState<KeyTestStatus>('idle');
  const [savedKeyLast4, setSavedKeyLast4] = useState(config.openaiApiKey ? config.openaiApiKey.slice(-4) : '');
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = async () => {
    const errors: Record<string, string> = {};

    if (!savedKeyLast4 && !newApiKey) {
      errors.openaiApiKey = 'Chave da API OpenAI é obrigatória';
    }

    if (localConfig.scope.maxTokens < 50 || localConfig.scope.maxTokens > 2000) {
      errors.maxTokens = 'Insira um valor entre 50 e 2000';
    }

    if (localConfig.scope.temperature < 0 || localConfig.scope.temperature > 1) {
      errors.temperature = 'Use um valor entre 0 e 1 (ex.: 0.7)';
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (newApiKey && connectionId && clientId) {
      setIsSavingKey(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token ?? SUPABASE_ANON_KEY;

        const res = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy/save-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            connection_id: connectionId,
            client_id: clientId,
            api_key: newApiKey,
            model: localConfig.model,
            max_tokens: localConfig.scope.maxTokens,
            temperature: localConfig.scope.temperature,
            persona_instructions: localConfig.persona.customInstructions,
            escalation_triggers: localConfig.scope.escalationTriggers,
            confidence_threshold: 0.4,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setSavedKeyLast4(data.last4);
          setNewApiKey('');
          setKeySaveResult({ success: true, message: `Chave salva com sucesso (terminando em ...${data.last4})` });
        } else {
          setKeySaveResult({ success: false, message: data.error ?? 'Erro ao salvar chave' });
          setIsSavingKey(false);
          return;
        }
      } catch (err) {
        setKeySaveResult({ success: false, message: 'Erro de rede ao salvar chave' });
        setIsSavingKey(false);
        return;
      }
      setIsSavingKey(false);
    }

    onSave({ ...localConfig, openaiApiKey: newApiKey || localConfig.openaiApiKey });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleTestKey = async () => {
    if (!connectionId || !clientId) {
      setKeyTestStatus('error');
      return;
    }
    setKeyTestStatus('testing');
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token ?? SUPABASE_ANON_KEY;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy/test-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ connection_id: connectionId, client_id: clientId }),
      });
      const data = await res.json();
      setKeyTestStatus(data.status as KeyTestStatus);
    } catch {
      setKeyTestStatus('error');
    }
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) return;
    setIsTestingAI(true);
    setTestResponse('Testando resposta da IA...');

    if (connectionId && clientId) {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token ?? SUPABASE_ANON_KEY;

        const res = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            connection_id: connectionId,
            client_id: clientId,
            user_message: testMessage,
            system_prompt: localConfig.persona.customInstructions,
          }),
        });
        const data = await res.json();
        setTestResponse(data.reply ?? data.error ?? 'Sem resposta');
      } catch {
        setTestResponse('Erro ao conectar com a IA. Verifique a chave configurada.');
      }
    } else {
      setTestResponse('Configure uma conexão e salve a chave antes de testar.');
    }
    setIsTestingAI(false);
  };

  const keyTestLabel: Record<KeyTestStatus, { label: string; color: string }> = {
    idle: { label: 'Testar Chave', color: 'bg-gray-600 hover:bg-gray-700' },
    testing: { label: 'Testando...', color: 'bg-gray-400' },
    ok: { label: 'Chave OK', color: 'bg-green-600' },
    invalid_key: { label: 'Chave Invalida', color: 'bg-red-600' },
    quota_exceeded: { label: 'Cota Esgotada', color: 'bg-orange-600' },
    not_configured: { label: 'Nao Configurada', color: 'bg-yellow-600' },
    error: { label: 'Erro de Conexao', color: 'bg-red-600' },
  };

  const addFAQ = () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      alert('Por favor, preencha pergunta e resposta');
      return;
    }

    const faq: FAQ = {
      id: Date.now().toString(),
      question: newFAQ.question,
      answer: newFAQ.answer,
      category: newFAQ.category || 'geral',
      tags: newFAQ.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      priority: 1
    };
    
    setLocalConfig({
      ...localConfig,
      ragKnowledgeBase: {
        ...localConfig.ragKnowledgeBase,
        faqs: [...localConfig.ragKnowledgeBase.faqs, faq]
      }
    });
    
    setNewFAQ({ question: '', answer: '', category: '', tags: '' });
  };

  const removeFAQ = (id: string) => {
    setLocalConfig({
      ...localConfig,
      ragKnowledgeBase: {
        ...localConfig.ragKnowledgeBase,
        faqs: localConfig.ragKnowledgeBase.faqs.filter(faq => faq.id !== id)
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
      <SaveToast visible={saveToast} message="Configuracao de IA salva" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Configuracao de IA</h2>
          <p className="text-sm text-gray-500 mt-0.5">Configure o assistente virtual com OpenAI</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Ajuda"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Dicas de Configuração</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Tokens:</strong> 150-500 para respostas concisas no WhatsApp</p>
            <p><strong>Temperatura:</strong> 0.7 para equilíbrio entre criatividade e precisão</p>
            <p><strong>Persona:</strong> Seja específico sobre tom, estilo e objetivos</p>
            <p><strong>RAG:</strong> Adicione FAQs para respostas mais precisas</p>
          </div>
        </div>
      )}

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
                      ? 'border-rose-500 text-rose-600'
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
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave da API OpenAI *
                  </label>

                  {savedKeyLast4 && !newApiKey && (
                    <div className="flex items-center space-x-2 mb-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <Key className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">Chave configurada: sk-...{savedKeyLast4}</span>
                      <button
                        onClick={() => setSavedKeyLast4('')}
                        className="ml-auto text-xs text-gray-500 hover:text-red-600 underline"
                      >
                        Substituir
                      </button>
                    </div>
                  )}

                  {(!savedKeyLast4 || newApiKey) && (
                    <input
                      type="password"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.openaiApiKey ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="sk-..."
                    />
                  )}

                  {validationErrors.openaiApiKey && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.openaiApiKey}</p>
                  )}
                  {keySaveResult && (
                    <p className={`text-xs mt-1 ${keySaveResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {keySaveResult.message}
                    </p>
                  )}

                  <div className="flex items-center space-x-2 mt-2">
                    <p className="text-xs text-gray-500 flex-1">
                      Chave armazenada criptografada no servidor. Nunca exposta no frontend.
                    </p>
                    <button
                      onClick={handleTestKey}
                      disabled={keyTestStatus === 'testing' || (!savedKeyLast4 && !newApiKey)}
                      className={`text-xs text-white px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors disabled:opacity-50 ${keyTestLabel[keyTestStatus].color}`}
                    >
                      {keyTestStatus === 'testing' && <Loader className="h-3 w-3 animate-spin" />}
                      <span>{keyTestLabel[keyTestStatus].label}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo OpenAI
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
                      <option value="objective">Objetivo</option>
                      <option value="welcoming">Acolhedor</option>
                      <option value="professional">Profissional</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instruções da Persona
                  </label>
                  <textarea
                    value={localConfig.persona.customInstructions}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      persona: {...localConfig.persona, customInstructions: e.target.value}
                    })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Você é a assistente virtual da Kohl, especializada em cursos de beleza. Seja prestativa, profissional e sempre promova nossos cursos quando apropriado..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máx. Tokens
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      value={localConfig.scope.maxTokens}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        scope: {...localConfig.scope, maxTokens: parseInt(e.target.value)}
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.maxTokens ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.maxTokens && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.maxTokens}</p>
                    )}
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
                      value={localConfig.scope.temperature}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        scope: {...localConfig.scope, temperature: parseFloat(e.target.value)}
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.temperature ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.temperature && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.temperature}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout (s)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={30}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Teste da IA */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">🧪 Testar Assistente de IA</h3>
                  
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
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

                {/* Status da Configuração */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-3">⚙️ Status da Configuração</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        {localConfig.openaiApiKey ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-gray-700">API Key OpenAI</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">Modelo: {localConfig.model}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">Tom: {localConfig.persona.tone}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">FAQs: {localConfig.ragKnowledgeBase.faqs.length}</span>
                      </div>
                    </div>
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
                    <label key={topic} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={localConfig.scope.canHandle.includes(topic)}
                        onChange={(e) => {
                          const newScope = e.target.checked
                            ? [...localConfig.scope.canHandle, topic]
                            : localConfig.scope.canHandle.filter(t => t !== topic);
                          setLocalConfig({
                            ...localConfig,
                            scope: {...localConfig.scope, canHandle: newScope}
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
                    <label key={trigger} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={localConfig.scope.escalationTriggers.includes(trigger)}
                        onChange={(e) => {
                          const newTriggers = e.target.checked
                            ? [...localConfig.scope.escalationTriggers, trigger]
                            : localConfig.scope.escalationTriggers.filter(t => t !== trigger);
                          setLocalConfig({
                            ...localConfig,
                            scope: {...localConfig.scope, escalationTriggers: newTriggers}
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
                  <p>• Cliente recebe: "Encaminhei ao atendente. Já te respondemos por aqui. 🙏"</p>
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
                
                {/* Adicionar FAQ */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Adicionar Nova FAQ</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Pergunta"
                        value={newFAQ.question}
                        onChange={(e) => setNewFAQ({...newFAQ, question: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Categoria"
                        value={newFAQ.category}
                        onChange={(e) => setNewFAQ({...newFAQ, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <textarea
                      placeholder="Resposta"
                      value={newFAQ.answer}
                      onChange={(e) => setNewFAQ({...newFAQ, answer: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        placeholder="Tags (separadas por vírgula)"
                        value={newFAQ.tags}
                        onChange={(e) => setNewFAQ({...newFAQ, tags: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={addFAQ}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de FAQs */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {localConfig.ragKnowledgeBase.faqs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma FAQ adicionada ainda</p>
                      <p className="text-sm">Adicione perguntas frequentes para melhorar as respostas da IA</p>
                    </div>
                  ) : (
                    localConfig.ragKnowledgeBase.faqs.map((faq) => (
                      <div key={faq.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {faq.category}
                              </span>
                              <h5 className="font-medium text-gray-900">{faq.question}</h5>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{faq.answer}</p>
                            
                            <div className="flex flex-wrap gap-1">
                              {faq.tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => removeFAQ(faq.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🧠 Como Funciona o RAG</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• A IA busca informações relevantes na base de conhecimento</p>
                  <p>• Usa busca semântica para encontrar conteúdo relacionado</p>
                  <p>• Combina o conhecimento com a pergunta do cliente</p>
                  <p>• Sempre cita a fonte quando usar informações da base</p>
                  <p>• Confiança mínima configurada para escalação automática</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}