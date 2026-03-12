import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Save, Eye, MessageSquare } from 'lucide-react';
import { SaveToast } from '../ui/StateViews';
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
  const [saveToast, setSaveToast] = useState(false);

  const addOption = () => {
    const newOption: MenuOption = {
      id: Date.now().toString(),
      number: (localMenu.options.length + 1).toString(),
      text: 'Nova opcao',
      action: 'course_info',
    };
    setLocalMenu({ ...localMenu, options: [...localMenu.options, newOption] });
  };

  const updateOption = (id: string, updates: Partial<MenuOption>) => {
    setLocalMenu({
      ...localMenu,
      options: localMenu.options.map(option =>
        option.id === id ? { ...option, ...updates } : option
      ),
    });
  };

  const removeOption = (id: string) => {
    setLocalMenu({ ...localMenu, options: localMenu.options.filter(option => option.id !== id) });
  };

  const handleSave = () => {
    onSave(localMenu);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const renderPreview = () => {
    const welcomeMessage = localMenu.welcomeMessage.replace('{{name}}', 'Maria');
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
            <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Kohl Beauty</span>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{welcomeMessage}</p>
            {localMenu.options.map((option) => (
              <p key={option.id} className="text-sm text-gray-700">
                <span className="font-medium">{option.number}</span> — {option.text}
              </p>
            ))}
            <p className="text-sm text-gray-700">
              <span className="font-medium">{localMenu.escalationOption.number}</span> — {localMenu.escalationOption.text}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SaveToast visible={saveToast} message="Menu salvo com sucesso" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Construtor de Menu</h2>
          <p className="text-sm text-gray-500 mt-0.5">Personalize o menu de boas-vindas do WhatsApp</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              previewMode
                ? 'bg-gray-900 hover:bg-gray-800 text-white'
                : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Modo edicao' : 'Visualizar'}
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Save className="h-4 w-4" />
            Salvar Menu
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Previa do Menu</p>
          {renderPreview()}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Mensagem de boas-vindas
              </label>
              <textarea
                value={localMenu.welcomeMessage}
                onChange={(e) => setLocalMenu({ ...localMenu, welcomeMessage: e.target.value })}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                placeholder="Ola {{name}}! Seja bem-vindo a Kohl Beauty.&#10;&#10;Selecione o numero do curso de seu interesse:"
              />
              <p className="text-xs text-gray-400 mt-1">
                Use <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> para personalizar com o nome do cliente
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Mensagem de opcao invalida
              </label>
              <textarea
                value={localMenu.fallbackMessage}
                onChange={(e) => setLocalMenu({ ...localMenu, fallbackMessage: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                placeholder="Opcao nao reconhecida. Por favor, escolha um numero valido do menu."
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Opcoes do Menu</p>
              <button
                onClick={addOption}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar opcao
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {localMenu.options.map((option) => (
                <div key={option.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {option.number}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{option.text}</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setEditingOption(editingOption === option.id ? null : option.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeOption(option.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {editingOption === option.id && (
                    <div className="space-y-3 px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Numero</label>
                          <input
                            type="text"
                            value={option.number}
                            onChange={(e) => updateOption(option.id, { number: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Acao</label>
                          <select
                            value={option.action}
                            onChange={(e) => updateOption(option.id, { action: e.target.value as any })}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-transparent"
                          >
                            <option value="course_info">Info do Curso</option>
                            <option value="sub_menu">Sub Menu</option>
                            <option value="escalate">Escalar</option>
                            <option value="custom_flow">Fluxo Personalizado</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Texto</label>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(option.id, { text: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-transparent"
                        />
                      </div>

                      {option.action === 'course_info' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Curso</label>
                          <select
                            value={option.courseId || ''}
                            onChange={(e) => updateOption(option.id, { courseId: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-transparent"
                          >
                            <option value="">Selecionar curso</option>
                            {kohlCourses.map((course) => (
                              <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {option.action === 'custom_flow' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Resposta personalizada</label>
                          <textarea
                            value={option.customResponse || ''}
                            onChange={(e) => updateOption(option.id, { customResponse: e.target.value })}
                            rows={2}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-transparent resize-none"
                            placeholder="Mensagem de resposta personalizada..."
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Previa em tempo real</p>
            {renderPreview()}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Boas praticas</p>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>Mantenha as opcoes claras e concisas</li>
                <li>Use numeros de 1 a 9 para selecao rapida</li>
                <li>Sempre inclua uma opcao para falar com um atendente</li>
                <li>Teste o menu com clientes reais antes de publicar</li>
                <li>Atualize as informacoes dos cursos regularmente</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
