import React from 'react';
import { 
  LayoutDashboard, 
  GitBranch, 
  Users, 
  Bot, 
  BarChart3, 
  Settings,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'flows', label: 'Fluxos & Campanhas', icon: GitBranch },
  { id: 'leads', label: 'Qualificação de Leads', icon: Users },
  { id: 'ai-service', label: 'SAC com IA', icon: Bot },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Status do Sistema</span>
            </div>
            <p className="text-xs text-green-700">Todos os serviços operando normalmente</p>
          </div>
        </div>
      </nav>
    </aside>
  );
}