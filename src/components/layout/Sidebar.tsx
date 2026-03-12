import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Users,
  Bot,
  BarChart3,
  Settings,
  Circle,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'flows', label: 'Fluxos e Campanhas', icon: GitBranch },
  { id: 'leads', label: 'Gestao de Leads', icon: Users },
  { id: 'ai-service', label: 'SAC com IA', icon: Bot },
  { id: 'reports', label: 'Relatorios', icon: BarChart3 },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="px-3 pb-4 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 px-3 py-2">
          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 flex-shrink-0" />
          <span className="text-xs text-gray-500">Sistema operando normalmente</span>
        </div>
      </div>
    </aside>
  );
}
