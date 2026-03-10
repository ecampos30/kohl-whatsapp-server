'use strict';

require('dotenv').config();

const express = require('express');
const bearerAuth = require('./auth');
const {
  startSession,
  getSession,
  stopSession,
  sendTextMessage,
  listSessions,
  restoreSessionsOnBoot,
} = require('./sessionManager');

const app = express();
const PORT = process.env.PORT || 3000;

const CONNECTION_ID_REGEX = /^[a-zA-Z0-9-]{1,64}$/;

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.get('/health', (req, res) => {
  const sessions = listSessions();
  res.json({
    ok: true,
    uptime: Math.floor(process.uptime()),
    sessionsActive: sessions.filter((s) => s.status === 'connected').length,
    sessionsTotal: sessions.length,
  });
});

app.use(bearerAuth);

app.get('/sessions', (req, res) => {
  res.json({ sessions: listSessions() });
});

app.post('/session/start', async (req, res) => {
  const { connectionId } = req.body;

  if (!connectionId || typeof connectionId !== 'string') {
    return res.status(400).json({ error: 'connectionId is required' });
  }

  if (!CONNECTION_ID_REGEX.test(connectionId)) {
    return res.status(400).json({
      error: 'connectionId must contain only letters, numbers and hyphens (max 64 chars)',
    });
  }

  try {
    await startSession(connectionId);
    return res.status(201).json({ ok: true, connectionId, status: 'scanning' });
  } catch (err) {
    if (err.code === 'SESSION_EXISTS') {
      return res.status(409).json({ error: 'Session already exists', connectionId });
    }
    console.error(`[${connectionId}] startSession error:`, err.message);
    return res.status(500).json({ error: 'Failed to start session' });
  }
});

app.get('/session/:connectionId/status', (req, res) => {
  const { connectionId } = req.params;
  const session = getSession(connectionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found', connectionId });
  }

  return res.json({
    connectionId,
    status: session.status,
    phoneNumber: session.phoneNumber,
    qrAvailable: !!session.qr,
    retryCount: session.retryCount,
    uptimeMs: Date.now() - session.startedAt,
  });
});

app.get('/session/:connectionId/qr', (req, res) => {
  const { connectionId } = req.params;
  const session = getSession(connectionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found', connectionId });
  }

  if (session.status === 'connected') {
    return res.status(410).json({ error: 'Session is already connected, QR not needed', connectionId });
  }

  if (!session.qr) {
    return res.status(204).end();
  }

  const QR_TTL_MS = 60000;
  const expiresAt = session.qrGeneratedAt + QR_TTL_MS;

  return res.json({
    connectionId,
    qr: session.qr,
    generatedAt: new Date(session.qrGeneratedAt).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    expired: Date.now() > expiresAt,
  });
});

app.post('/session/:connectionId/send', async (req, res) => {
  const { connectionId } = req.params;
  const { to, text } = req.body;

  if (!to || typeof to !== 'string') {
    return res.status(400).json({ error: 'to is required' });
  }

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const messageId = await sendTextMessage(connectionId, to, text);
    return res.json({ ok: true, messageId });
  } catch (err) {
    if (err.code === 'SESSION_NOT_FOUND') {
      return res.status(404).json({ error: 'Session not found', connectionId });
    }
    if (err.code === 'SESSION_NOT_CONNECTED') {
      return res.status(409).json({ error: err.message, connectionId });
    }
    console.error(`[${connectionId}] sendMessage error:`, err.message);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

app.delete('/session/:connectionId', async (req, res) => {
  const { connectionId } = req.params;

  try {
    await stopSession(connectionId);
    return res.json({ ok: true, connectionId });
  } catch (err) {
    if (err.code === 'SESSION_NOT_FOUND') {
      return res.status(404).json({ error: 'Session not found', connectionId });
    }
    console.error(`[${connectionId}] stopSession error:`, err.message);
    return res.status(500).json({ error: 'Failed to stop session' });
  }
});

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Baileys multi-session server running on port ${PORT}`);
  restoreSessionsOnBoot().catch((err) => {
    console.error('[boot] restoreSessionsOnBoot failed:', err.message);
  });
});
