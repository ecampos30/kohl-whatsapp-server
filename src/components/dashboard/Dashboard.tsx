import React from 'react';
import { WhatsAppAccount } from '../../types/accounts';
import { MetricsGrid } from './MetricsGrid';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { LeadFunnel } from './LeadFunnel';

interface DashboardProps {
  account: WhatsAppAccount;
}

export function Dashboard({ account }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral da conta {account.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            account.status === 'active' ? 'bg-green-100 text-green-800' :
            account.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {account.status === 'active' ? 'Ativo' : 
             account.status === 'pending' ? 'Pendente' : 'Inativo'}
          </div>
        </div>
      </div>

      <MetricsGrid account={account} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions account={account} />
        <LeadFunnel account={account} />
      </div>
      
      <RecentActivity account={account} />
    </div>
  );
}