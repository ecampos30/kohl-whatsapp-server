import React from 'react';
import { MessageCircle, Calendar, MapPin, Star } from 'lucide-react';
import { Lead } from '../../types/accounts';

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'novo': return 'bg-blue-100 text-blue-800';
      case 'qualificando': return 'bg-yellow-100 text-yellow-800';
      case 'oportunidade': return 'bg-orange-100 text-orange-800';
      case 'cliente': return 'bg-green-100 text-green-800';
      case 'perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
          <p className="text-gray-600">{lead.whatsapp}</p>
          {lead.email && <p className="text-sm text-gray-500">{lead.email}</p>}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(lead.score)}`}>
            <Star className="h-3 w-3 inline mr-1" />
            {lead.score}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
            {lead.stage}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        {lead.city && (
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>{lead.city}, {lead.state}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>{new Date(lead.lastInteraction).toLocaleDateString('pt-BR')}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <MessageCircle className="h-4 w-4" />
          <span>{lead.source}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {lead.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {tag}
          </span>
        ))}
      </div>
      
      {lead.notes && (
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{lead.notes}</p>
      )}
    </div>
  );
}