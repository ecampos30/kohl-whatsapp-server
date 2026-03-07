import React, { useState } from 'react';
import { Save, TestTube, AlertTriangle } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';

interface AIConfigurationProps {
  account: WhatsAppAccount;
}

export function AIConfiguration({ account }: AIConfigurationProps) {
  const [config, setConfig] = useState(account.aiConfig);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');

  const handleSave = () => {
    console.log('Saving AI config:', config);
  };

  const handleTest = () => {
    setTestResponse('Olá! Sou o assistente virtual da ' + account.name + '. Como posso ajudá-lo hoje?');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem do Sistema (Persona)
            </label>
            <textarea
              value={config.systemMessage}
              onChange={(e) => setConfig({...config, systemMessage: e.target.value})}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Você é um assistente virtual da empresa X. Seja prestativo, profissional e..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máx. Tokens
              </label>
              <input
                type="number"
                value={config.maxTokens}
                onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (segundos)
              </label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig({...config, timeout: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperatura (0.0 - 1.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.temperature}
              onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Regras de Handoff</span>
            </div>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Palavras de urgência: cancelamento, estorno, problema</p>
              <p>• Sentimento negativo detectado</p>
              <p>• Solicitação de falar com humano</p>
              <p>• Confiança baixa na resposta (&lt; 70%)</p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Testar IA</h3>
            
            <div className="space-y-3">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Digite uma mensagem de teste..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <button
                onClick={handleTest}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <TestTube className="h-4 w-4" />
                <span>Testar Resposta</span>
              </button>
              
              {testResponse && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{testResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Salvar Configurações</span>
        </button>
      </div>
    </div>
  );
}