import React, { useState } from 'react';
import { X, Clock, Users, Image, FileText } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';

interface CreateCampaignModalProps {
  account: WhatsAppAccount;
  onClose: () => void;
}

export function CreateCampaignModal({ account, onClose }: CreateCampaignModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    schedule: {
      time: '',
      frequency: 'once' as const
    },
    content: {
      type: 'text' as const,
      text: '',
      mediaUrl: ''
    },
    segmentation: {
      tags: [] as string[],
      stage: [] as string[]
    }
  });

  const handleSubmit = () => {
    console.log('Creating campaign:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Criar Nova Campanha</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Informações</span>
            <span className="text-xs text-gray-600">Conteúdo</span>
            <span className="text-xs text-gray-600">Segmentação</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Campanha
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Oferta Black Friday"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Horário de Envio
                </label>
                <input
                  type="time"
                  value={formData.schedule.time}
                  onChange={(e) => setFormData({
                    ...formData, 
                    schedule: {...formData.schedule, time: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequência
                </label>
                <select
                  value={formData.schedule.frequency}
                  onChange={(e) => setFormData({
                    ...formData, 
                    schedule: {...formData.schedule, frequency: e.target.value as any}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="once">Uma vez</option>
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Conteúdo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: 'text', label: 'Texto', icon: FileText },
                  { type: 'image', label: 'Imagem', icon: Image },
                  { type: 'video', label: 'Vídeo', icon: Image },
                  { type: 'document', label: 'PDF', icon: FileText }
                ].map((contentType) => {
                  const Icon = contentType.icon;
                  return (
                    <button
                      key={contentType.type}
                      onClick={() => setFormData({
                        ...formData,
                        content: {...formData.content, type: contentType.type as any}
                      })}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        formData.content.type === contentType.type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs">{contentType.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <textarea
                value={formData.content.text}
                onChange={(e) => setFormData({
                  ...formData,
                  content: {...formData.content, text: e.target.value}
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Olá {{first_name}}! Temos uma oferta especial para você..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use variáveis: {'{{'} first_name {'}}'}, {'{{'} city {'}}'}, {'{{'} tag {'}}'}, {'{{'} last_interaction {'}}'}
              </p>
            </div>
            
            {formData.content.type !== 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Mídia
                </label>
                <input
                  type="url"
                  value={formData.content.mediaUrl}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: {...formData.content, mediaUrl: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Segmentação por Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {['lead-novo', 'aluno', 'parceria', 'quente', 'reengajar'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTags = formData.segmentation.tags.includes(tag)
                        ? formData.segmentation.tags.filter(t => t !== tag)
                        : [...formData.segmentation.tags, tag];
                      setFormData({
                        ...formData,
                        segmentation: {...formData.segmentation, tags: newTags}
                      });
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.segmentation.tags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estágios do Funil
              </label>
              <div className="space-y-2">
                {['novo', 'qualificando', 'oportunidade', 'cliente'].map((stage) => (
                  <label key={stage} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.segmentation.stage.includes(stage)}
                      onChange={(e) => {
                        const newStages = e.target.checked
                          ? [...formData.segmentation.stage, stage]
                          : formData.segmentation.stage.filter(s => s !== stage);
                        setFormData({
                          ...formData,
                          segmentation: {...formData.segmentation, stage: newStages}
                        });
                      }}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">{stage}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {step === 3 ? 'Criar Campanha' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}