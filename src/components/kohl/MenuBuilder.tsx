import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, Eye, MessageSquare } from 'lucide-react';
import { MenuTemplate, MenuOption, CourseInfo } from '../../types/kohl-system';
import { kohlCourses } from '../../data/kohl-courses';

interface MenuBuilderProps {
  menu: MenuTemplate;
  onSave: (menu: MenuTemplate) => void;
}

export function MenuBuilder({ menu, onSave }: MenuBuilderProps) {
  const [localMenu, setLocalMenu] = useState(menu);
  const [previewMode, setPreviewMode] = useState(false);
  const [editingOption, setEditingOption] = useState<string | null>(null);

  const addOption = () => {
    const newOption: MenuOption = {
      id: Date.now().toString(),
      number: (localMenu.options.length + 1).toString(),
      text: 'New Option',
      action: 'course_info'
    };
    
    setLocalMenu({
      ...localMenu,
      options: [...localMenu.options, newOption]
    });
  };

  const updateOption = (id: string, updates: Partial<MenuOption>) => {
    setLocalMenu({
      ...localMenu,
      options: localMenu.options.map(option =>
        option.id === id ? { ...option, ...updates } : option
      )
    });
  };

  const removeOption = (id: string) => {
    setLocalMenu({
      ...localMenu,
      options: localMenu.options.filter(option => option.id !== id)
    });
  };

  const handleSave = () => {
    onSave(localMenu);
  };

  const renderPreview = () => {
    const customerName = "Maria";
    const welcomeMessage = localMenu.welcomeMessage.replace('{{name}}', customerName);
    
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-gray-900">Kohl Beauty Courses</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-gray-800 whitespace-pre-line">{welcomeMessage}</p>
            
            {localMenu.options.map((option) => (
              <div key={option.id} className="text-gray-700">
                {option.number} - {option.text}
              </div>
            ))}
            
            <div className="text-gray-700">
              {localMenu.escalationOption.number} - {localMenu.escalationOption.text}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Construtor de Menu</h2>
          <p className="text-gray-600">Personalize seu menu de boas-vindas do WhatsApp</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              previewMode 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>{previewMode ? 'Modo Edição' : 'Visualizar'}</span>
          </button>
          
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Menu</span>
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Visualização do Menu</h3>
          {renderPreview()}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem de Boas-vindas
              </label>
              <textarea
                value={localMenu.welcomeMessage}
                onChange={(e) => setLocalMenu({...localMenu, welcomeMessage: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="{{name}}, welcome to Kohl 👋&#10;&#10;Select the number for your course of interest:"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{{'} name {'}'} para personalizar com o nome do cliente
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem de Erro
              </label>
              <textarea
                value={localMenu.fallbackMessage}
                onChange={(e) => setLocalMenu({...localMenu, fallbackMessage: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Desculpe, não entendi essa opção..."
              />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Opções do Menu</h3>
              <button
                onClick={addOption}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Opção</span>
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {localMenu.options.map((option, index) => (
                <div key={option.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {option.number}
                      </span>
                      <span className="font-medium text-gray-900">{option.text}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingOption(editingOption === option.id ? null : option.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeOption(option.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {editingOption === option.id && (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Número
                          </label>
                          <input
                            type="text"
                            value={option.number}
                            onChange={(e) => updateOption(option.id, { number: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Ação
                          </label>
                          <select
                            value={option.action}
                            onChange={(e) => updateOption(option.id, { action: e.target.value as any })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="course_info">Info do Curso</option>
                            <option value="sub_menu">Sub Menu</option>
                            <option value="escalate">Escalar</option>
                            <option value="custom_flow">Fluxo Personalizado</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Texto
                        </label>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(option.id, { text: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {option.action === 'course_info' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Curso
                          </label>
                          <select
                            value={option.courseId || ''}
                            onChange={(e) => updateOption(option.id, { courseId: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Selecionar Curso</option>
                            {kohlCourses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {option.action === 'custom_flow' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Resposta Personalizada
                          </label>
                          <textarea
                            value={option.customResponse || ''}
                            onChange={(e) => updateOption(option.id, { customResponse: e.target.value })}
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Digite a mensagem de resposta personalizada..."
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Visualização ao Vivo</h3>
            {renderPreview()}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Dicas do Menu</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Mantenha as opções claras e concisas</li>
                <li>• Use números de 1-10 para seleção fácil</li>
                <li>• Sempre inclua uma opção para falar com um atendente</li>
                <li>• Teste seu menu com clientes reais</li>
                <li>• Atualize as informações dos cursos regularmente</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}