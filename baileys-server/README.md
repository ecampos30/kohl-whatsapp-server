# Baileys Multi-Session Server

Servidor Express para gerenciar multiplas sessoes WhatsApp simultaneamente usando Baileys.
Cada cliente tem sua propria sessao isolada com autenticacao persistida em disco.

---

## Requisitos

- Node.js >= 20
- npm
- Porta 3000 liberada no Security Group da EC2 (ou a porta configurada em `PORT`)

---

## Instalacao

```bash
# 1. Entre na pasta do servidor
cd baileys-server

# 2. Instale as dependencias
npm install

# 3. Copie o arquivo de ambiente
cp .env.example .env

# 4. Edite o .env e defina um token seguro
nano .env
# BAILEYS_API_SECRET=seu-token-secreto-aqui
```

---

## Rodando

### Desenvolvimento (com auto-reload)

```bash
npm run dev
```

### Producao simples

```bash
npm start
```

### Producao com PM2 (recomendado para EC2)

```bash
# Instalar PM2 globalmente (uma vez)
npm install -g pm2

# Iniciar o servidor
pm2 start src/index.js --name baileys-server

# Ver logs em tempo real
pm2 logs baileys-server

# Reiniciar
pm2 restart baileys-server

# Parar
pm2 stop baileys-server

# Ativar auto-start no boot da EC2
pm2 startup
pm2 save
```

---

## Endpoints

Todos os endpoints (exceto `/health`) exigem header:

```
Authorization: Bearer SEU_TOKEN
```

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /health | Status do servidor (sem autenticacao) |
| GET | /sessions | Lista todas as sessoes ativas |
| POST | /session/start | Inicia uma nova sessao |
| GET | /session/:connectionId/status | Status de uma sessao |
| GET | /session/:connectionId/qr | QR code para escanear |
| POST | /session/:connectionId/send | Envia mensagem de texto |
| DELETE | /session/:connectionId | Encerra uma sessao |

---

## Testando com curl

Substitua `SEU_TOKEN` pelo valor de `BAILEYS_API_SECRET` no seu `.env`.
Substitua `localhost:3000` pelo IP/dominio da sua EC2 se estiver testando remotamente.

### 1. Health check (sem token)

```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "ok": true,
  "uptime": 42,
  "sessionsActive": 0,
  "sessionsTotal": 0
}
```

---

### 2. Iniciar uma sessao

```bash
curl -X POST http://localhost:3000/session/start \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "cliente-abc"}'
```

Resposta:
```json
{
  "ok": true,
  "connectionId": "cliente-abc",
  "status": "scanning"
}
```

---

### 3. Ver status da sessao

```bash
curl http://localhost:3000/session/cliente-abc/status \
  -H "Authorization: Bearer SEU_TOKEN"
```

Resposta:
```json
{
  "connectionId": "cliente-abc",
  "status": "scanning",
  "phoneNumber": null,
  "qrAvailable": true,
  "retryCount": 0,
  "uptimeMs": 8500
}
```

Status possiveis: `disconnected`, `scanning`, `connected`

---

### 4. Obter QR code

```bash
curl http://localhost:3000/session/cliente-abc/qr \
  -H "Authorization: Bearer SEU_TOKEN"
```

Resposta:
```json
{
  "connectionId": "cliente-abc",
  "qr": "data:image/png;base64,iVBORw0...",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-01-15T10:31:00.000Z",
  "expired": false
}
```

O campo `qr` e um data URI PNG. Voce pode colar diretamente em uma tag `<img>` no browser
ou usar um visualizador de base64 para escanear com o WhatsApp.

Codigos de status possiveis:
- `200` — QR disponivel
- `204` — Sessao iniciando, QR ainda nao gerado (tente novamente em 2-3 segundos)
- `410` — Sessao ja conectada, QR nao e necessario

---

### 5. Enviar mensagem de texto

```bash
curl -X POST http://localhost:3000/session/cliente-abc/send \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "5511999999999", "text": "Ola, teste de mensagem!"}'
```

O campo `to` aceita:
- Numero com DDI: `5511999999999`
- Com mascara: `+55 (11) 99999-9999` (caracteres nao numericos sao removidos automaticamente)

Resposta:
```json
{
  "ok": true,
  "messageId": "3EB0ABC123"
}
```

---

### 6. Listar todas as sessoes

```bash
curl http://localhost:3000/sessions \
  -H "Authorization: Bearer SEU_TOKEN"
```

Resposta:
```json
{
  "sessions": [
    {
      "connectionId": "cliente-abc",
      "status": "connected",
      "phoneNumber": "5511999999999",
      "qrAvailable": false,
      "retryCount": 0,
      "startedAt": 1705311600000
    }
  ]
}
```

---

### 7. Encerrar uma sessao

```bash
curl -X DELETE http://localhost:3000/session/cliente-abc \
  -H "Authorization: Bearer SEU_TOKEN"
```

Resposta:
```json
{
  "ok": true,
  "connectionId": "cliente-abc"
}
```

A pasta `./sessions/cliente-abc` com as credenciais e mantida em disco.
Ao iniciar a mesma sessao novamente, o WhatsApp reconecta sem precisar escanear o QR.

---

## Sessoes Persistidas

As credenciais de cada sessao sao salvas em `./sessions/<connectionId>/`.
Ao reiniciar o servidor, as sessoes **nao sao restauradas automaticamente em memoria**
(o mapa de sessoes e limpo), mas as credenciais no disco permanecem validas.

Para restaurar uma sessao apos reiniciar o servidor, basta chamar `POST /session/start`
com o mesmo `connectionId` — o Baileys carregara as credenciais salvas e reconectara
sem exibir novo QR.

---

## Proximas etapas

- Restaurar sessoes salvas automaticamente ao subir o servidor
- Encaminhar mensagens recebidas para Supabase via webhook
- Atualizar status de conexao no banco de dados
- Integracao com o frontend React
