import React, { useState } from 'react';
import { X, User, MapPin, DollarSign, Clock } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';

interface QualificationFormProps {
  account: WhatsAppAccount;
  onClose: () => void;
}

export function QualificationForm({ account, onClose }: QualificationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    city: '',
    state: '',
    source: 'site',
    objective: '',
    budget: '',
    urgency: 1,
    experience: 'iniciante',
    notes: ''
  });

  const calculateScore = () => {
    let score = 0;
    
    // Orçamento adequado (+30)
    if (formData.budget === 'alto') score += 30;
    else if (formData.budget === 'medio') score += 20;
    else if (formData.budget === 'baixo') score += 10;
    
    // Urgência alta (+25)
    score += formData.urgency * 8;
    
    // Cidade próxima (+15) - mock logic
    if (formData.city.toLowerCase().includes('são paulo')) score += 15;
    
    // Interesse alinhado (+20) - mock logic
    if (formData.objective.toLowerCase().includes('curso')) score += 20;
    
    return Math.min(score, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const score = calculateScore();
    console.log('New lead with score:', score, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Formulário de Qualificação</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Maria Silva"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                required
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (opcional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="maria@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="São Paulo"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objetivo / Interesse Principal
            </label>
            <textarea
              value={formData.objective}
              onChange={(e) => setFormData({...formData, objective: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva o interesse ou objetivo do lead..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Orçamento Estimado
              </label>
              <select
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="baixo">Até R$ 500</option>
                <option value="medio">R$ 500 - R$ 2.000</option>
                <option value="alto">Acima de R$ 2.000</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Urgência (1-3)
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({...formData, urgency: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 - Baixa</option>
                <option value={2}>2 - Média</option>
                <option value={3}>3 - Alta</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experiência
              </label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionais
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações importantes sobre o lead..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Pré-visualização do Score</h3>
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-blue-600">{calculateScore()}</div>
              <div className="text-sm text-blue-700">
                {calculateScore() >= 70 ? '🔥 Lead Quente' : 
                 calculateScore() >= 40 ? '🟡 Lead Morno' : '❄️ Lead Frio'}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Criar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}