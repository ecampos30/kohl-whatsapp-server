import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RefreshCw, CheckCircle, AlertTriangle, QrCode, Wifi } from 'lucide-react';
import { getSessionQr, getSessionStatus } from '../../integrations/whatsapp/webSession';

interface QRCodeDisplayProps {
  connectionId: string;
  onClose: () => void;
  onConnectionSuccess: (connectionId: string) => void;
}

type Phase = 'loading' | 'connecting' | 'scanning' | 'connected' | 'error';

const ERROR_GRACE_MS = 15000;

export function QRCodeDisplay({ connectionId, onClose, onConnectionSuccess }: QRCodeDisplayProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);
  const phaseRef = useRef<Phase>('loading');
  const qrImageRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  const updatePhase = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const updateQrImage = (img: string | null) => {
    qrImageRef.current = img;
    setQrImage(img);
  };

  const stopPolling = useCallback(() => {
    stoppedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (stoppedRef.current) return;

    const statusRes = await getSessionStatus(connectionId);

    if (statusRes.status === 'connected') {
      stopPolling();
      updatePhase('connected');
      setTimeout(() => {
        onConnectionSuccess(connectionId);
        onClose();
      }, 2000);
      return;
    }

    if (statusRes.status === 'scanning' || statusRes.status === 'connecting' || !statusRes.status) {
      const qrRes = await getSessionQr(connectionId);
      if (qrRes.qr) {
        updateQrImage(qrRes.qr);
        updatePhase('scanning');
        return;
      }
      if (phaseRef.current === 'loading' || phaseRef.current === 'connecting') {
        updatePhase('connecting');
      }
      return;
    }

    if (statusRes.status === 'disconnected' || statusRes.status === 'error') {
      const elapsed = Date.now() - startedAtRef.current;
      if (!qrImageRef.current && elapsed > ERROR_GRACE_MS) {
        stopPolling();
        updatePhase('error');
        setErrorMsg(statusRes.error ?? 'Sessao encerrada ou erro no servidor Baileys.');
      } else if (!qrImageRef.current) {
        updatePhase('connecting');
      }
    }
  }, [connectionId, onClose, onConnectionSuccess, stopPolling]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stoppedRef.current = false;
    startedAtRef.current = Date.now();
    poll();
    intervalRef.current = setInterval(poll, 4000);
  }, [poll]);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, []);

  const handleClose = () => {
    stopPolling();
    onClose();
  };

  const handleRetry = () => {
    updatePhase('loading');
    updateQrImage(null);
    setErrorMsg('');
    startPolling();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-gray-700" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Escanear QR Code</h2>
              <p className="text-xs text-gray-400">WhatsApp Web — Baileys</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center space-y-4">
          {phase === 'loading' && (
            <div className="flex flex-col items-center space-y-3 py-8">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Buscando QR no servidor...</p>
            </div>
          )}

          {phase === 'connecting' && (
            <div className="flex flex-col items-center space-y-3 py-8">
              <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
              <p className="text-sm font-medium text-gray-700">Iniciando sessao Baileys...</p>
              <p className="text-xs text-gray-400 text-center">Aguardando geracao do QR Code.<br />Isso pode levar alguns segundos.</p>
            </div>
          )}

          {phase === 'scanning' && (
            <>
              {qrImage ? (
                <div className="border-4 border-gray-900 rounded-xl p-2 bg-white">
                  <img
                    src={qrImage}
                    alt="QR Code WhatsApp"
                    className="w-56 h-56 object-contain"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                </div>
              )}

              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-gray-800">Abra o WhatsApp no celular</p>
                <p className="text-xs text-gray-500">Menu → Dispositivos conectados → Conectar dispositivo</p>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-full justify-center">
                <RefreshCw className="h-3 w-3 animate-spin flex-shrink-0" />
                <span>Verificando status a cada 4 segundos...</span>
              </div>
            </>
          )}

          {phase === 'connected' && (
            <div className="flex flex-col items-center space-y-3 py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Conectado com sucesso!</p>
                <p className="text-sm text-gray-500 mt-1">WhatsApp Web ativo. Fechando...</p>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-700">
                <Wifi className="h-3.5 w-3.5" />
                <span>Sessao Baileys ativa</span>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center space-y-3 py-8">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Nao foi possivel obter o QR</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">{errorMsg}</p>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center space-x-1.5 text-sm text-blue-600 hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Tentar novamente</span>
              </button>
            </div>
          )}
        </div>

        <div className="px-5 pb-4 flex justify-end border-t border-gray-100 pt-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
