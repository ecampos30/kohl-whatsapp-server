// Cliente OpenAI para SAC com IA
export interface OpenAIConfig {
  apiKey: string;
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface RAGContext {
  faqs: Array<{ question: string; answer: string; category: string }>;
  documents: Array<{ title: string; content: string; url?: string }>;
  courseInfo: Array<{ name: string; description: string; price: number }>;
}

export interface AIRequest {
  message: string;
  persona: string;
  ragContext?: RAGContext;
  userContext?: {
    name?: string;
    email?: string;
    city?: string;
    tags?: string[];
    lastInteraction?: string;
  };
}

export interface AIResponse {
  response: string;
  confidence: number;
  shouldEscalate: boolean;
  escalationReason?: string;
  usedRAG: boolean;
  ragSources?: string[];
}

export class OpenAIClient {
  private config: OpenAIConfig;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  // Método principal para fazer perguntas à IA
  async askAI(request: AIRequest): Promise<AIResponse> {
    try {
      console.log('[OpenAI] Processando pergunta:', request.message);

      // 1. Verificar se deve escalar antes de processar
      const shouldEscalateEarly = this.checkEarlyEscalation(request.message);
      if (shouldEscalateEarly.shouldEscalate) {
        return {
          response: 'Encaminhei sua solicitação ao atendente. Já te respondemos por aqui. 🙏',
          confidence: 1.0,
          shouldEscalate: true,
          escalationReason: shouldEscalateEarly.reason,
          usedRAG: false
        };
      }

      // 2. Buscar contexto RAG relevante
      const ragContext = this.searchRAGContext(request.message, request.ragContext);

      // 3. Construir prompt com persona e contexto
      const systemPrompt = this.buildSystemPrompt(request.persona, ragContext);
      const userPrompt = this.buildUserPrompt(request.message, request.userContext);

      // 4. Fazer chamada para OpenAI
      const response = await this.callOpenAI(systemPrompt, userPrompt);

      // 5. Analisar resposta e decidir escalação
      const analysis = this.analyzeResponse(response, request.message);

      return {
        response: analysis.shouldEscalate 
          ? 'Encaminhei sua solicitação ao atendente. Já te respondemos por aqui. 🙏'
          : response,
        confidence: analysis.confidence,
        shouldEscalate: analysis.shouldEscalate,
        escalationReason: analysis.escalationReason,
        usedRAG: ragContext.length > 0,
        ragSources: ragContext.map(item => item.source)
      };

    } catch (error) {
      console.error('[OpenAI] Erro ao processar pergunta:', error);
      
      return {
        response: 'Desculpe, estou com dificuldades técnicas no momento. Vou encaminhar você para um atendente humano.',
        confidence: 0,
        shouldEscalate: true,
        escalationReason: 'Erro técnico na IA',
        usedRAG: false
      };
    }
  }

  // Verificar escalação precoce (palavras-chave críticas)
  private checkEarlyEscalation(message: string): { shouldEscalate: boolean; reason?: string } {
    const lowerMessage = message.toLowerCase();
    
    // Palavras de urgência/reclamação
    const urgentKeywords = [
      'cancelar', 'estorno', 'reembolso', 'problema', 'reclamação', 
      'insatisfeito', 'ruim', 'péssimo', 'horrível', 'fraude',
      'advogado', 'procon', 'processo', 'judicial'
    ];

    // Solicitação direta de humano
    const humanKeywords = [
      'falar com atendente', 'atendente humano', 'pessoa real',
      'não quero robô', 'quero humano', 'gerente', 'supervisor'
    ];

    for (const keyword of urgentKeywords) {
      if (lowerMessage.includes(keyword)) {
        return { shouldEscalate: true, reason: `Palavra crítica detectada: ${keyword}` };
      }
    }

    for (const keyword of humanKeywords) {
      if (lowerMessage.includes(keyword)) {
        return { shouldEscalate: true, reason: 'Solicitação de atendente humano' };
      }
    }

    return { shouldEscalate: false };
  }

  // Buscar contexto relevante na base RAG
  private searchRAGContext(message: string, ragContext?: RAGContext): Array<{ content: string; source: string }> {
    if (!ragContext) return [];

    const results: Array<{ content: string; source: string; score: number }> = [];
    const lowerMessage = message.toLowerCase();

    // Buscar em FAQs
    ragContext.faqs.forEach(faq => {
      const questionScore = this.calculateSimilarity(lowerMessage, faq.question.toLowerCase());
      if (questionScore > 0.3) {
        results.push({
          content: `P: ${faq.question}\nR: ${faq.answer}`,
          source: `FAQ: ${faq.category}`,
          score: questionScore
        });
      }
    });

    // Buscar em informações de cursos
    ragContext.courseInfo.forEach(course => {
      const nameScore = this.calculateSimilarity(lowerMessage, course.name.toLowerCase());
      const descScore = this.calculateSimilarity(lowerMessage, course.description.toLowerCase());
      const maxScore = Math.max(nameScore, descScore);
      
      if (maxScore > 0.2) {
        results.push({
          content: `Curso: ${course.name}\nDescrição: ${course.description}\nPreço: R$ ${course.price}`,
          source: `Curso: ${course.name}`,
          score: maxScore
        });
      }
    });

    // Buscar em documentos
    ragContext.documents.forEach(doc => {
      if (doc.content) {
        const contentScore = this.calculateSimilarity(lowerMessage, doc.content.toLowerCase());
        if (contentScore > 0.25) {
          results.push({
            content: doc.content,
            source: `Documento: ${doc.title}`,
            score: contentScore
          });
        }
      }
    });

    // Retornar os 3 melhores resultados
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ content, source }) => ({ content, source }));
  }

  // Calcular similaridade simples (em produção, usar embeddings)
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    let matches = 0;
    words1.forEach(word => {
      if (words2.some(w => w.includes(word) || word.includes(w))) {
        matches++;
      }
    });
    
    return matches / Math.max(words1.length, words2.length);
  }

  // Construir prompt do sistema
  private buildSystemPrompt(persona: string, ragContext: Array<{ content: string; source: string }>): string {
    let prompt = `${persona}\n\n`;
    
    prompt += `REGRAS IMPORTANTES:
- Seja sempre prestativo e profissional
- Use informações da base de conhecimento quando disponível
- Se não souber algo, seja honesto e ofereça encaminhar para atendente
- Sempre cite a fonte quando usar informações específicas
- Mantenha respostas concisas e objetivas para WhatsApp
- Use emojis moderadamente para deixar a conversa mais amigável\n\n`;

    if (ragContext.length > 0) {
      prompt += `BASE DE CONHECIMENTO DISPONÍVEL:\n`;
      ragContext.forEach((item, index) => {
        prompt += `${index + 1}. ${item.source}:\n${item.content}\n\n`;
      });
    }

    return prompt;
  }

  // Construir prompt do usuário
  private buildUserPrompt(message: string, userContext?: AIRequest['userContext']): string {
    let prompt = `Mensagem do cliente: "${message}"\n\n`;
    
    if (userContext) {
      prompt += `CONTEXTO DO CLIENTE:\n`;
      if (userContext.name) prompt += `- Nome: ${userContext.name}\n`;
      if (userContext.email) prompt += `- Email: ${userContext.email}\n`;
      if (userContext.city) prompt += `- Cidade: ${userContext.city}\n`;
      if (userContext.tags?.length) prompt += `- Tags: ${userContext.tags.join(', ')}\n`;
      if (userContext.lastInteraction) {
        prompt += `- Última interação: ${new Date(userContext.lastInteraction).toLocaleDateString('pt-BR')}\n`;
      }
      prompt += '\n';
    }

    prompt += `Responda de forma natural e útil, usando as informações da base de conhecimento quando relevante.`;
    
    return prompt;
  }

  // Fazer chamada para OpenAI
  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 1000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout: IA demorou muito para responder');
      }
      
      throw error;
    }
  }

  // Analisar resposta para decidir escalação
  private analyzeResponse(response: string, originalMessage: string): {
    confidence: number;
    shouldEscalate: boolean;
    escalationReason?: string;
  } {
    const lowerResponse = response.toLowerCase();
    
    // Indicadores de baixa confiança
    const uncertaintyPhrases = [
      'não sei', 'não tenho certeza', 'não posso', 'não consigo',
      'talvez', 'pode ser', 'não tenho informação', 'não está claro'
    ];

    // Indicadores de que precisa de humano
    const humanNeededPhrases = [
      'falar com atendente', 'encaminhar', 'transferir',
      'não posso ajudar', 'fora do meu escopo'
    ];

    let confidence = 0.8; // Confiança base

    // Reduzir confiança se houver incerteza
    for (const phrase of uncertaintyPhrases) {
      if (lowerResponse.includes(phrase)) {
        confidence -= 0.2;
        break;
      }
    }

    // Escalar se indicar necessidade de humano
    for (const phrase of humanNeededPhrases) {
      if (lowerResponse.includes(phrase)) {
        return {
          confidence: 0.3,
          shouldEscalate: true,
          escalationReason: 'IA indicou necessidade de atendente humano'
        };
      }
    }

    // Escalar se confiança muito baixa
    if (confidence < 0.4) {
      return {
        confidence,
        shouldEscalate: true,
        escalationReason: 'Baixa confiança na resposta da IA'
      };
    }

    return {
      confidence,
      shouldEscalate: false
    };
  }

  // Testar conexão com OpenAI
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('[OpenAI] Erro ao testar conexão:', error);
      return false;
    }
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}