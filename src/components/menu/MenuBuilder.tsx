import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, Eye, Move, Image, DollarSign } from 'lucide-react';
import { MenuItem, WhatsAppNumber } from '../../types/system';

interface MenuBuilderProps {
  number: WhatsAppNumber;
  items: MenuItem[];
  onSave: (items: MenuItem[]) => void;
}

export function MenuBuilder({ number, items, onSave }: MenuBuilderProps) {
  const [localItems, setLocalItems] = useState<MenuItem[]>(items);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSave = () => {
    onSave(localItems);
  };

  const addItem = (newItem: Omit<MenuItem, 'id' | 'order'>) => {
    const item: MenuItem = {
      ...newItem,
      id: Date.now().toString(),
      order: localItems.length + 1,
      number_id: number.id
    };
    setLocalItems([...localItems, item]);
    setShowAddModal(false);
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    setLocalItems(localItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (id: string) => {
    setLocalItems(localItems.filter(item => item.id !== id));
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const index = localItems.findIndex(item => item.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === localItems.length - 1)
    ) return;

    const newItems = [...localItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Atualizar ordem
    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });
    
    setLocalItems(newItems);
  };

  const renderPreview = () => {
    const customerName = "Maria";
    
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">📱</span>
            </div>
            <span className="font-medium text-gray-900">{number.name}</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-gray-800">
              {number.settings.welcome_message.replace('{{first_name}}', customerName)}
            </p>
            
            {localItems
              .filter(item => item.is_active)
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <div key={item.id} className="text-gray-700">
                  {index + 1} - {item.title}
                </div>
              ))}
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
          <p className="text-gray-600">Configure o menu para {number.name} ({number.phone})</p>
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
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Item</span>
          </button>
          
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
            <h3 className="text-lg font-medium text-gray-900">Itens do Menu</h3>
            
            {localItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">Nenhum item no menu ainda</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Adicionar Primeiro Item
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {localItems
                  .sort((a, b) => a.order - b.order)
                  .map((item, index) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-600">{item.slug}</p>
                          </div>
                          {!item.is_active && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              Inativo
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => moveItem(item.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <Move className="h-4 w-4 rotate-180" />
                          </button>
                          <button
                            onClick={() => moveItem(item.id, 'down')}
                            disabled={index === localItems.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <Move className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        {item.description}
                      </div>

                      {item.price && (
                        <div className="flex items-center space-x-1 text-sm text-green-600">
                          <DollarSign className="h-3 w-3" />
                          <span>R$ {item.price.toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Visualização ao Vivo</h3>
            {renderPreview()}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Dicas do Menu</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use títulos claros e concisos</li>
                <li>• Adicione descrições atrativas</li>
                <li>• Configure preços quando aplicável</li>
                <li>• Teste o menu com clientes reais</li>
                <li>• Mantenha a ordem lógica dos itens</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Item */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSave={addItem}
        />
      )}

      {/* Modal Editar Item */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updates) => {
            updateItem(editingItem.id, updates);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

// Modal para adicionar item
function AddItemModal({ 
  onClose, 
  onSave 
}: { 
  onClose: () => void;
  onSave: (item: Omit<MenuItem, 'id' | 'order' | 'number_id'>) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    image_url: '',
    price: '',
    is_active: true,
    secondary_menu: {
      matricular_text: 'Matricular / Quero comprar',
      atendente_text: 'Falar com atendente'
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug || !formData.description) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    onSave({
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      image_url: formData.image_url || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      is_active: formData.is_active,
      secondary_menu: formData.secondary_menu
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Adicionar Item ao Menu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Nanoblading"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="nanoblading"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Técnica ultra-fina para sobrancelhas naturais..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="h-4 w-4 inline mr-1" />
                URL da Imagem
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Preço (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1200.00"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Menu Secundário</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto do Botão "Matricular"
                </label>
                <input
                  type="text"
                  value={formData.secondary_menu.matricular_text}
                  onChange={(e) => setFormData({
                    ...formData,
                    secondary_menu: {...formData.secondary_menu, matricular_text: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto do Botão "Atendente"
                </label>
                <input
                  type="text"
                  value={formData.secondary_menu.atendente_text}
                  onChange={(e) => setFormData({
                    ...formData,
                    secondary_menu: {...formData.secondary_menu, atendente_text: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="mr-2 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Item ativo no menu
            </label>
          </div>

          <div className="flex justify-end space-x-3">
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
              Adicionar Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para editar item (similar ao AddItemModal, mas com dados preenchidos)
function EditItemModal({ 
  item,
  onClose, 
  onSave 
}: { 
  item: MenuItem;
  onClose: () => void;
  onSave: (updates: Partial<MenuItem>) => void;
}) {
  const [formData, setFormData] = useState({
    title: item.title,
    slug: item.slug,
    description: item.description,
    image_url: item.image_url || '',
    price: item.price?.toString() || '',
    is_active: item.is_active,
    secondary_menu: item.secondary_menu
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      image_url: formData.image_url || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      is_active: formData.is_active,
      secondary_menu: formData.secondary_menu
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Editar Item do Menu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mesmo conteúdo do AddItemModal, mas com valores preenchidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3">
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
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}