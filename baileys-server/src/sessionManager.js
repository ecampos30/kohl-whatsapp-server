'use strict';

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const logger = pino({ level: 'silent' });
const sessions = new Map();

const SESSIONS_DIR = path.resolve(process.cwd(), 'sessions');

function ensureSessionsDir(connectionId) {
  const dir = path.join(SESSIONS_DIR, connectionId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function formatPhoneNumber(to) {
  const cleaned = to.replace(/\D/g, '');
  if (cleaned.endsWith('@s.whatsapp.net')) return to;
  return `${cleaned}@s.whatsapp.net`;
}

async function startSession(connectionId) {
  if (sessions.has(connectionId)) {
    const err = new Error('Session already exists');
    err.code = 'SESSION_EXISTS';
    throw err;
  }

  const sessionDir = ensureSessionsDir(connectionId);

  const sessionData = {
    sock: null,
    status: 'disconnected',
    qr: null,
    qrGeneratedAt: null,
    phoneNumber: null,
    retryCount: 0,
    startedAt: Date.now(),
  };

  sessions.set(connectionId, sessionData);

  await _connectSession(connectionId, sessionDir);
}

async function _connectSession(connectionId, sessionDir) {
  const sessionData = sessions.get(connectionId);
  if (!sessionData) return;

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['BaileysServer', 'Chrome', '1.0.0'],
  });

  sessionData.sock = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const session = sessions.get(connectionId);
    if (!session) return;

    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrDataUrl = await QRCode.toDataURL(qr);
        session.qr = qrDataUrl;
        session.qrGeneratedAt = Date.now();
        session.status = 'scanning';
        console.log(`[${connectionId}] QR code generated`);
      } catch (err) {
        console.error(`[${connectionId}] Failed to generate QR data URL:`, err.message);
      }
    }

    if (connection === 'open') {
      session.status = 'connected';
      session.qr = null;
      session.qrGeneratedAt = null;
      session.retryCount = 0;

      const user = sock.user;
      if (user && user.id) {
        session.phoneNumber = user.id.split(':')[0].split('@')[0];
      }

      console.log(`[${connectionId}] Connected — phone: ${session.phoneNumber}`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[${connectionId}] Connection closed — statusCode: ${statusCode}, shouldReconnect: ${shouldReconnect}`);

      session.status = 'disconnected';
      session.sock = null;

      if (shouldReconnect && sessions.has(connectionId)) {
        const delay = Math.min(1000 * 2 ** session.retryCount, 30000);
        session.retryCount += 1;
        console.log(`[${connectionId}] Reconnecting in ${delay}ms (attempt ${session.retryCount})`);
        setTimeout(() => {
          if (sessions.has(connectionId)) {
            _connectSession(connectionId, sessionDir).catch((err) => {
              console.error(`[${connectionId}] Reconnect failed:`, err.message);
            });
          }
        }, delay);
      }
    }
  });

  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe) {
        console.log(`[${connectionId}] Inbound message from ${msg.key.remoteJid}`);
      }
    }
  });
}

function getSession(connectionId) {
  return sessions.get(connectionId) || null;
}

async function stopSession(connectionId) {
  const session = sessions.get(connectionId);
  if (!session) {
    const err = new Error('Session not found');
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }

  if (session.sock) {
    try {
      await session.sock.logout();
    } catch {
      try {
        session.sock.end();
      } catch {
      }
    }
  }

  sessions.delete(connectionId);
  console.log(`[${connectionId}] Session stopped`);
}

async function sendTextMessage(connectionId, to, text) {
  const session = sessions.get(connectionId);

  if (!session) {
    const err = new Error('Session not found');
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }

  if (session.status !== 'connected') {
    const err = new Error(`Session is not connected (status: ${session.status})`);
    err.code = 'SESSION_NOT_CONNECTED';
    throw err;
  }

  const jid = formatPhoneNumber(to);
  const result = await session.sock.sendMessage(jid, { text });
  return result?.key?.id || null;
}

function listSessions() {
  const result = [];
  for (const [connectionId, session] of sessions.entries()) {
    result.push({
      connectionId,
      status: session.status,
      phoneNumber: session.phoneNumber,
      qrAvailable: !!session.qr,
      retryCount: session.retryCount,
      startedAt: session.startedAt,
    });
  }
  return result;
}

module.exports = {
  startSession,
  getSession,
  stopSession,
  sendTextMessage,
  listSessions,
};
