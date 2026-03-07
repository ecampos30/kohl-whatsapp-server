// Sistema de intenções para classificação de mensagens
export type Intent = 
  | 'course_inquiry'      // Dúvidas sobre cursos
  | 'pricing'            // Preços e formas de pagamento
  | 'scheduling'         // Datas e horários
  | 'enrollment'         // Processo de matrícula
  | 'support'           // Suporte geral
  | 'complaint'         // Reclamações
  | 'cancellation'      // Cancelamentos/estornos
  | 'human_request'     // Pedido para falar com humano
  | 'greeting'          // Saudações
  | 'goodbye'           // Despedidas
  | 'unknown';          // Não classificado

export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities?: Record<string, string>;
  shouldEscalate: boolean;
  escalationReason?: string;
}

export class IntentClassifier {
  private patterns: Record<Intent, string[]> = {
    course_inquiry: [
      'curso', 'cursos', 'nanoblading', 'microblading', 'bb glow',
      'sobrancelha', 'informação', 'informações', 'detalhes',
      'o que é', 'como funciona', 'duração', 'certificado'
    ],
    pricing: [
      'preço', 'valor', 'custa', 'quanto', 'pagamento', 'pagar',
      'parcelamento', 'desconto', 'promoção', 'pix', 'cartão'
    ],
    scheduling: [
      'data', 'quando', 'horário', 'agenda', 'disponível',
      'próxima turma', 'calendário', 'agendar', 'marcar'
    ],
    enrollment: [
      'matricular', 'inscrever', 'quero fazer', 'me inscrever',
      'vaga', 'reservar', 'garantir', 'confirmar'
    ],
    support: [
      'ajuda', 'suporte', 'dúvida', 'problema', 'não consigo',
      'como faço', 'preciso', 'orientação'
    ],
    complaint: [
      'reclamação', 'insatisfeito', 'ruim', 'péssimo', 'problema',
      'não gostei', 'decepcionado', 'erro', 'falha'
    ],
    cancellation: [
      'cancelar', 'estorno', 'reembolso', 'desistir', 'não quero mais',
      'devolver', 'dinheiro de volta'
    ],
    human_request: [
      'atendente', 'pessoa', 'humano', 'falar com alguém',
      'não quero robô', 'gerente', 'supervisor'
    ],
    greeting: [
      'oi', 'olá', 'bom dia', 'boa tarde', 'boa noite',
      'e aí', 'tudo bem', 'como vai'
    ],
    goodbye: [
      'tchau', 'obrigado', 'obrigada', 'até logo', 'falou',
      'valeu', 'bye', 'até mais'
    ],
    unknown: []
  };

  // Classificar intenção da mensagem
  classifyIntent(message: string): IntentResult {
    const lowerMessage = message.toLowerCase();
    const words = lowerMessage.split(/\s+/);
    
    const scores: Record<Intent, number> = {
      course_inquiry: 0,
      pricing: 0,
      scheduling: 0,
      enrollment: 0,
      support: 0,
      complaint: 0,
      cancellation: 0,
      human_request: 0,
      greeting: 0,
      goodbye: 0,
      unknown: 0
    };

    // Calcular scores para cada intenção
    Object.entries(this.patterns).forEach(([intent, patterns]) => {
      if (intent === 'unknown') return;
      
      patterns.forEach(pattern => {
        if (lowerMessage.includes(pattern)) {
          scores[intent as Intent] += 1;
        }
      });
    });

    // Encontrar intenção com maior score
    const maxScore = Math.max(...Object.values(scores));
    const topIntent = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as Intent || 'unknown';
    
    const confidence = maxScore > 0 ? Math.min(maxScore / words.length * 2, 1) : 0;

    // Verificar se deve escalar
    const shouldEscalate = this.shouldEscalateIntent(topIntent, confidence, lowerMessage);

    return {
      intent: topIntent,
      confidence,
      entities: this.extractEntities(lowerMessage),
      shouldEscalate: shouldEscalate.should,
      escalationReason: shouldEscalate.reason
    };
  }

  // Verificar se deve escalar baseado na intenção
  private shouldEscalateIntent(
    intent: Intent, 
    confidence: number, 
    message: string
  ): { should: boolean; reason?: string } {
    // Sempre escalar para reclamações e cancelamentos
    if (intent === 'complaint') {
      return { should: true, reason: 'Reclamação detectada' };
    }
    
    if (intent === 'cancellation') {
      return { should: true, reason: 'Solicitação de cancelamento' };
    }
    
    if (intent === 'human_request') {
      return { should: true, reason: 'Pedido para falar com atendente' };
    }

    // Escalar se confiança muito baixa
    if (confidence < 0.3) {
      return { should: true, reason: 'Baixa confiança na classificação' };
    }

    // Verificar linguagem ofensiva
    const offensiveWords = ['idiota', 'burro', 'lixo', 'merda', 'porra'];
    if (offensiveWords.some(word => message.includes(word))) {
      return { should: true, reason: 'Linguagem inadequada detectada' };
    }

    return { should: false };
  }

  // Extrair entidades da mensagem
  private extractEntities(message: string): Record<string, string> {
    const entities: Record<string, string> = {};

    // Extrair valores monetários
    const moneyRegex = /r\$?\s*(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi;
    const moneyMatch = message.match(moneyRegex);
    if (moneyMatch) {
      entities.money = moneyMatch[0];
    }

    // Extrair datas
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
    const dateMatch = message.match(dateRegex);
    if (dateMatch) {
      entities.date = dateMatch[0];
    }

    // Extrair emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatch = message.match(emailRegex);
    if (emailMatch) {
      entities.email = emailMatch[0];
    }

    // Extrair telefones
    const phoneRegex = /(?:\+55\s?)?(?:\(?11\)?\s?)?(?:9\s?)?[0-9]{4}[-\s]?[0-9]{4}/g;
    const phoneMatch = message.match(phoneRegex);
    if (phoneMatch) {
      entities.phone = phoneMatch[0];
    }

    return entities;
  }

  // Obter sugestões de resposta baseadas na intenção
  getSuggestedResponses(intent: Intent): string[] {
    const responses: Record<Intent, string[]> = {
      course_inquiry: [
        'Temos vários cursos disponíveis! Qual área te interessa mais?',
        'Nossos cursos são certificados e incluem kit completo. Sobre qual você gostaria de saber?'
      ],
      pricing: [
        'Nossos preços variam de R$ 800 a R$ 2.500. Qual curso te interessa?',
        'Temos várias formas de pagamento: PIX, cartão (12x), dinheiro. Sobre qual curso?'
      ],
      scheduling: [
        'Temos turmas mensais! Qual curso te interessa para verificar as próximas datas?',
        'As próximas turmas começam em breve. Sobre qual curso você gostaria de saber?'
      ],
      enrollment: [
        'Que ótimo! Vou te ajudar com a matrícula. Qual curso te interessa?',
        'Perfeito! Para qual curso você gostaria de se matricular?'
      ],
      support: [
        'Estou aqui para ajudar! Qual sua dúvida?',
        'Como posso te auxiliar hoje?'
      ],
      greeting: [
        'Olá! Bem-vindo(a) à Kohl! Como posso te ajudar?',
        'Oi! Sou a assistente virtual da Kohl. Em que posso ajudar?'
      ],
      goodbye: [
        'Obrigado pelo contato! Estamos sempre aqui quando precisar. 😊',
        'Até logo! Qualquer dúvida, é só chamar. 👋'
      ],
      complaint: ['Encaminhando para atendente...'],
      cancellation: ['Encaminhando para atendente...'],
      human_request: ['Encaminhando para atendente...'],
      unknown: [
        'Não entendi bem. Pode reformular sua pergunta?',
        'Desculpe, não compreendi. Como posso ajudar?'
      ]
    };

    return responses[intent] || responses.unknown;
  }

  // Verificar se intenção está no escopo da IA
  isInAIScope(intent: Intent, aiScope: string[]): boolean {
    const scopeMapping: Record<string, Intent[]> = {
      'Dúvidas sobre cursos': ['course_inquiry', 'scheduling'],
      'Formas de pagamento': ['pricing'],
      'Datas/agenda': ['scheduling'],
      'Políticas': ['support'],
      'Processo de matrícula': ['enrollment'],
      'Suporte geral': ['support', 'greeting', 'goodbye']
    };

    for (const scope of aiScope) {
      const allowedIntents = scopeMapping[scope] || [];
      if (allowedIntents.includes(intent)) {
        return true;
      }
    }

    return false;
  }
}