import React, { useState } from 'react';
import { Save, Shield, Clock, MessageSquare } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';

interface SettingsProps {
  account: WhatsAppAccount;
}

export function Settings({ account }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Configurações para {account.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'general', label: 'Geral', icon: MessageSquare },
              { id: 'business-hours', label: 'Horário Comercial', icon: Clock },
              { id: 'compliance', label: 'Compliance', icon: Shield },
            ].map((tab) => {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Conta
                  </label>
                  <input
                    type="text"
                    defaultValue={account.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Negócio
                  </label>
                  <input
                    type="text"
                    defaultValue={account.businessType}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persona/Identidade do SAC
                </label>
                <textarea
                  defaultValue={account.persona}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva a personalidade e tom de voz do atendimento..."
                />
              </div>
            </div>
          )}

          {activeTab === 'business-hours' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    defaultValue={account.businessHours.start}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário de Término
                  </label>
                  <input
                    type="time"
                    defaultValue={account.businessHours.end}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias de Funcionamento
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                    <label key={index} className="flex flex-col items-center">
                      <input
                        type="checkbox"
                        defaultChecked={account.businessHours.days.includes(index)}
                        className="mb-1"
                      />
                      <span className="text-xs text-gray-600">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem Fora do Horário
                </label>
                <textarea
                  defaultValue="Olá! Nosso atendimento funciona de segunda a sexta, das 9h às 18h. Deixe sua mensagem que retornaremos assim que possível!"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">LGPD - Proteção de Dados</h3>
                <p className="text-sm text-green-700 mb-3">
                  Sistema configurado para compliance com LGPD. Dados sensíveis são criptografados e logs são mascarados.
                </p>
                <button className="text-sm text-green-700 underline hover:text-green-900">
                  Ver política de privacidade
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Opt-in Obrigatório</h4>
                    <p className="text-sm text-gray-600">Registrar consentimento antes de enviar mensagens</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Janela de 24h</h4>
                    <p className="text-sm text-gray-600">Respeitar janela do WhatsApp Business API</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Logs Mascarados</h4>
                    <p className="text-sm text-gray-600">Ocultar dados sensíveis em logs públicos</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comando EXCLUIR DADOS
                </label>
                <input
                  type="text"
                  defaultValue="EXCLUIR DADOS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Palavra-chave que permite ao usuário excluir todos os seus dados (LGPD)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Save className="h-4 w-4" />
          <span>Salvar Configurações</span>
        </button>
      </div>
    </div>
  );
}