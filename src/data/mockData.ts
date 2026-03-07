import { WhatsAppAccount, Lead, Campaign } from '../types/accounts';

export const mockAccounts: WhatsAppAccount[] = [
  {
    id: '1',
    number: '+55 11 99999-1111',
    name: 'Escola Tech - Comercial',
    persona: 'Assistente comercial prestativo e técnico, especializado em cursos de programação',
    businessType: 'Educação/Cursos',
    timezone: 'America/Sao_Paulo',
    status: 'active',
    businessHours: {
      start: '09:00',
      end: '18:00',
      days: [1, 2, 3, 4, 5]
    },
    aiConfig: {
      systemMessage: 'Você é um assistente virtual da Escola Tech, especializada em cursos de programação. Seja prestativo, técnico mas acessível, e sempre direcione para nossos cursos quando apropriado.',
      maxTokens: 500,
      temperature: 0.7,
      timeout: 12
    }
  },
  {
    id: '2',
    number: '+55 11 99999-2222',
    name: 'Escola Tech - Suporte Alunos',
    persona: 'Assistente de suporte educacional, focado em ajudar alunos ativos',
    businessType: 'Educação/Suporte',
    timezone: 'America/Sao_Paulo',
    status: 'active',
    businessHours: {
      start: '08:00',
      end: '20:00',
      days: [1, 2, 3, 4, 5, 6]
    },
    aiConfig: {
      systemMessage: 'Você é o assistente de suporte da Escola Tech. Ajude nossos alunos com dúvidas sobre plataforma, conteúdo e cronogramas. Seja paciente e didático.',
      maxTokens: 400,
      temperature: 0.6,
      timeout: 10
    }
  },
  {
    id: '3',
    number: '+55 11 99999-3333',
    name: 'Escola Tech - Parcerias',
    persona: 'Assistente de parcerias B2B, profissional e focado em negócios',
    businessType: 'Parcerias/B2B',
    timezone: 'America/Sao_Paulo',
    status: 'active',
    businessHours: {
      start: '09:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5]
    },
    aiConfig: {
      systemMessage: 'Você representa a área de parcerias da Escola Tech. Foque em oportunidades de parceria corporativa, treinamentos in-company e programas de capacitação.',
      maxTokens: 300,
      temperature: 0.8,
      timeout: 15
    }
  }
];

export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Maria Silva',
    whatsapp: '+55 11 98888-1111',
    email: 'maria@email.com',
    city: 'São Paulo',
    state: 'SP',
    source: 'instagram',
    tags: ['lead-novo', 'programacao', 'quente'],
    stage: 'oportunidade',
    score: 85,
    lastInteraction: '2025-01-27T14:30:00Z',
    owner: 'João Vendedor',
    notes: 'Interessada em curso Full Stack. Tem experiência básica em HTML/CSS.',
    accountId: '1'
  },
  {
    id: '2',
    name: 'Carlos Santos',
    whatsapp: '+55 11 97777-2222',
    email: 'carlos@empresa.com',
    city: 'Rio de Janeiro',
    state: 'RJ',
    source: 'anuncio',
    tags: ['b2b', 'corporativo'],
    stage: 'qualificando',
    score: 65,
    lastInteraction: '2025-01-27T13:15:00Z',
    notes: 'Gerente de TI interessado em treinamento para equipe.',
    accountId: '3'
  },
  {
    id: '3',
    name: 'Ana Costa',
    whatsapp: '+55 11 96666-3333',
    city: 'Belo Horizonte',
    state: 'MG',
    source: 'indicacao',
    tags: ['aluno', 'python'],
    stage: 'cliente',
    score: 95,
    lastInteraction: '2025-01-27T10:20:00Z',
    notes: 'Aluna ativa do curso de Python. Muito engajada.',
    accountId: '2'
  },
  {
    id: '4',
    name: 'Pedro Oliveira',
    whatsapp: '+55 11 95555-4444',
    city: 'Salvador',
    state: 'BA',
    source: 'site',
    tags: ['lead-novo'],
    stage: 'novo',
    score: 35,
    lastInteraction: '2025-01-27T16:45:00Z',
    notes: 'Primeiro contato. Interesse não especificado.',
    accountId: '1'
  }
];

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Oferta Black Friday - Programação',
    accountId: '1',
    status: 'active',
    schedule: {
      time: '09:00',
      timezone: 'America/Sao_Paulo',
      frequency: 'once'
    },
    content: {
      type: 'text',
      text: 'Olá {{first_name}}! 🔥 Nossa Black Friday chegou! Cursos de programação com até 70% OFF. Acesse: https://escola.tech/bf?utm_source=whatsapp&utm_campaign=bf2025',
      buttons: [
        { text: 'Ver Ofertas', action: 'url:https://escola.tech/bf' },
        { text: 'Falar com Consultor', action: 'handoff' }
      ]
    },
    segmentation: {
      tags: ['lead-novo', 'programacao'],
      score: { min: 40, max: 100 }
    },
    metrics: {
      sent: 1250,
      delivered: 1198,
      read: 856,
      clicked: 234,
      replied: 89
    }
  },
  {
    id: '2',
    name: 'Lembrete de Aula - Python',
    accountId: '2',
    status: 'active',
    schedule: {
      time: '16:00',
      timezone: 'America/Sao_Paulo',
      frequency: 'daily'
    },
    content: {
      type: 'text',
      text: 'Oi {{first_name}}! 📚 Sua aula de Python está começando em 1 hora. Acesse a plataforma: https://plataforma.escola.tech'
    },
    segmentation: {
      tags: ['aluno', 'python'],
      stage: ['cliente']
    },
    metrics: {
      sent: 450,
      delivered: 445,
      read: 389,
      clicked: 156,
      replied: 23
    }
  },
  {
    id: '3',
    name: 'Proposta Corporativa',
    accountId: '3',
    status: 'active',
    schedule: {
      time: '11:00',
      timezone: 'America/Sao_Paulo',
      frequency: 'weekly'
    },
    content: {
      type: 'text',
      text: 'Olá {{first_name}}! Nossa proposta de treinamento corporativo está pronta. Quando podemos agendar uma apresentação?'
    },
    segmentation: {
      tags: ['b2b', 'corporativo'],
      score: { min: 60, max: 100 }
    },
    metrics: {
      sent: 85,
      delivered: 83,
      read: 71,
      clicked: 28,
      replied: 15
    }
  }
];