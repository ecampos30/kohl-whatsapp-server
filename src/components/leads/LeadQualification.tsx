import React, { useState } from 'react';
import { Search, Filter, Download, Plus } from 'lucide-react';
import { WhatsAppAccount, Lead } from '../../types/accounts';
import { LeadCard } from './LeadCard';
import { LeadKanban } from './LeadKanban';
import { QualificationForm } from './QualificationForm';
import { mockLeads } from '../../data/mockData';

interface LeadQualificationProps {
  account: WhatsAppAccount;
}

export function LeadQualification({ account }: LeadQualificationProps) {
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [leads] = useState<Lead[]>(
    mockLeads.filter(l => l.accountId === account.id)
  );

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.whatsapp.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Qualificação de Leads</h1>
          <p className="text-gray-600">Gerencie e qualifique leads para {account.name}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setView(view === 'list' ? 'kanban' : 'list')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
          >
            {view === 'list' ? 'Visualização Kanban' : 'Visualização Lista'}
          </button>
          
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>

        {view === 'kanban' ? (
          <LeadKanban leads={filteredLeads} />
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <QualificationForm 
          account={account}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}