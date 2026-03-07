import React from 'react';
import { X, AlertTriangle, Server, Key } from 'lucide-react';

interface QRCodeDisplayProps {
  connectionId: string;
  onClose: () => void;
  onConnectionSuccess: (connectionId: string) => void;
}

export function QRCodeDisplay({ onClose }: QRCodeDisplayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">WhatsApp Web QR</h2>
            <p className="text-gray-500 text-sm">Conexão via QR Code</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900 text-sm">Conexão QR requer backend Node.js externo</p>
              <p className="text-amber-800 text-sm mt-1">
                O WhatsApp Web QR Code funciona apenas quando existe um servidor Node.js 24/7 rodando
                a biblioteca <strong>Baileys</strong> ou <strong>whatsapp-web.js</strong>. Este painel
                roda em ambiente serverless (Edge Functions) que não suporta WebSockets persistentes
                necessários para a sessão WhatsApp Web.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Server className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900 text-sm">O que é necessário para QR funcionar:</span>
            </div>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="bg-gray-200 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Um servidor VPS/servidor dedicado rodando Node.js 24/7</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-gray-200 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Biblioteca Baileys instalada: <code className="bg-gray-100 px-1 rounded">npm install @whiskeysockets/baileys</code></span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-gray-200 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Endpoints REST expostos para este painel consumir (QR, status, sendMessage)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-gray-200 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                <span>O status "connected" só pode ser marcado quando o socket emite <code className="bg-gray-100 px-1 rounded">state: "open"</code></span>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <Key className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 text-sm">Alternativa recomendada: WhatsApp Business API</p>
              <p className="text-blue-800 text-sm mt-1">
                Configure uma conexão do tipo <strong>"Business API"</strong> usando suas credenciais do
                Meta Business Manager. Funciona completamente neste ambiente — sem servidor externo,
                sem QR Code, mais estável e com suporte a templates e botões interativos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
