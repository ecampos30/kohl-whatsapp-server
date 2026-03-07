import React, { useState } from 'react';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';
import { MetricsChart } from './MetricsChart';
import { CampaignPerformance } from './CampaignPerformance';

interface ReportsProps {
  account: WhatsAppAccount;
}

export function Reports({ account }: ReportsProps) {
  const [dateRange, setDateRange] = useState('7days');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise de performance para {account.name}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="90days">Últimos 90 dias</option>
            <option value="custom">Período personalizado</option>
          </select>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Mensagens</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">8,742</div>
          <div className="text-sm text-green-600">+12% vs período anterior</div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Taxa de Conversão</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">23.5%</div>
          <div className="text-sm text-green-600">+3.2% vs período anterior</div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Tempo Médio</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">2.3min</div>
          <div className="text-sm text-green-600">-0.5min vs período anterior</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart />
        <CampaignPerformance />
      </div>
    </div>
  );
}