import React from 'react';
import { ChevronDown, Bell, User } from 'lucide-react';
import { WhatsAppAccount } from '../../types/accounts';

interface HeaderProps {
  selectedAccount: WhatsAppAccount;
  onAccountChange: (account: WhatsAppAccount) => void;
  accounts: WhatsAppAccount[];
}

export function Header({ selectedAccount, onAccountChange, accounts }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-gray-900 tracking-tight">Kohl Bot Manager</h1>

          <div className="h-4 w-px bg-gray-200" />

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors border border-gray-200 hover:border-gray-300"
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                selectedAccount.status === 'active' ? 'bg-emerald-500' :
                selectedAccount.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              <span className="font-medium text-gray-900">{selectedAccount.name}</span>
              <span className="text-gray-400 text-xs">{selectedAccount.number}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      onAccountChange(account);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedAccount.id === account.id ? 'bg-gray-50 border-l-2 border-gray-900' : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{account.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{account.number}</div>
                        {account.businessType && (
                          <div className="text-xs text-gray-400 mt-0.5">{account.businessType}</div>
                        )}
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        account.status === 'active' ? 'bg-emerald-500' :
                        account.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
