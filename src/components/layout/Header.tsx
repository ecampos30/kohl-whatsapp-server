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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Bot Manager</h1>
          
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900">{selectedAccount.name}</span>
                <span className="text-xs text-gray-600">{selectedAccount.number}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      onAccountChange(account);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      selectedAccount.id === account.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-600">{account.number}</div>
                        <div className="text-xs text-gray-500">{account.businessType}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        account.status === 'active' ? 'bg-green-500' : 
                        account.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Admin User</span>
          </div>
        </div>
      </div>
    </header>
  );
}