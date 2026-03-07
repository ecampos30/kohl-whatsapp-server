import React from 'react';
import { Lead } from '../../types/accounts';
import { Calendar, MessageCircle, Star } from 'lucide-react';

interface LeadKanbanProps {
  leads: Lead[];
}

const stages = [
  { id: 'novo', title: 'Novos', color: 'blue' },
  { id: 'qualificando', title: 'Qualificando', color: 'yellow' },
  { id: 'oportunidade', title: 'Oportunidade', color: 'orange' },
  { id: 'cliente', title: 'Cliente', color: 'green' },
];

export function LeadKanban({ leads }: LeadKanbanProps) {
  const getLeadsByStage = (stage: string) => 
    leads.filter(lead => lead.stage === stage);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id);
        
        return (
          <div key={stage.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{stage.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                stage.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                stage.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                stage.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }`}>
                {stageLeads.length}
              </span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stageLeads.map((lead) => (
                <div 
                  key={lead.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{lead.name}</h4>
                      <p className="text-sm text-gray-600">{lead.whatsapp}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(lead.score)}`}>
                      {lead.score}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {lead.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {lead.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{lead.tags.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(lead.lastInteraction).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{lead.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}