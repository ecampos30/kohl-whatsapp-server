// Engine de fluxo para SAC unificado
import { OpenAIClient, AIRequest, AIResponse } from '../../integrations/openai/client';
import { WhatsAppBusinessAPI } from '../../integrations/whatsapp/apiClient';
import { WhatsAppWebSession } from '../../integrations/whatsapp/webSession';

export type FlowState = 
  | 'MENU_HOME' 
  | 'COURSE_INFO' 
  | 'SECONDARY_MENU' 
  | 'ENROLLMENT' 
  | 'SAC_IA'
  | 'COLLECT_NAME'
  | 'COLLECT_EMAIL'
  | 'HANDOFF_HUMAN';

export interface FlowContext {
  userId: string;
  whatsappNumber: string;
  currentState: FlowState;
  selectedCourse?: string;
  userData: {
    name?: string;
    first_name?: string;
    email?: string;
    city?: string;
    tags: string[];
  };
  sessionData: Record<string, any>;
}

export interface FlowMessage {
  text: string;
  type: 'text' | 'interactive' | 'image';
  buttons?: Array<{ id: string; text: string }>;
  listItems?: Array<{ id: string; title: string; description?: string }>;
}

export class FlowEngine {
  private openaiClient: OpenAIClient;
  private whatsappClient: WhatsAppBusinessAPI | WhatsAppWebSession;
  private contexts: Map<string, FlowContext> = new Map();

  constructor(
    openaiClient: OpenAIClient,
    whatsappClient: WhatsAppBusinessAPI | WhatsAppWebSession
  ) {
    this.openaiClient = openaiClient;
    this.whatsappClient = whatsappClient;
  }

  // Processar mensagem recebida
  async processMessage(
    userId: string, 
    message: string, 
    whatsappNumber: string
  ): Promise<FlowMessage[]> {
    try {
      // Obter ou criar contexto do usuário
      let context = this.contexts.get(userId);
      if (!context) {
        context = {
          userId,
          whatsappNumber,
          currentState: 'MENU_HOME',
          userData: { tags: [] },
          sessionData: {}
        };
        this.contexts.set(userId, context);
      }

      console.log(`[FlowEngine] Processando mensagem no estado ${context.currentState}:`, message);

      // Processar baseado no estado atual
      const responses = await this.handleState(context, message);
      
      // Salvar contexto atualizado
      this.contexts.set(userId, context);

      return responses;

    } catch (error) {
      console.error('[FlowEngine] Erro ao processar mensagem:', error);
      return [{
        text: 'Desculpe, ocorreu um erro. Vou encaminhar você para um atendente.',
        type: 'text'
      }];
    }
  }

  // Manipular estados do fluxo
  private async handleState(context: FlowContext, message: string): Promise<FlowMessage[]> {
    switch (context.currentState) {
      case 'MENU_HOME':
        return this.handleMenuHome(context, message);
      
      case 'COURSE_INFO':
        return this.handleCourseInfo(context, message);
      
      case 'SECONDARY_MENU':
        return this.handleSecondaryMenu(context, message);
      
      case 'ENROLLMENT':
        return this.handleEnrollment(context, message);
      
      case 'SAC_IA':
        return this.handleSacIA(context, message);
      
      case 'COLLECT_NAME':
        return this.handleCollectName(context, message);
      
      case 'COLLECT_EMAIL':
        return this.handleCollectEmail(context, message);
      
      default:
        return this.handleMenuHome(context, message);
    }
  }

  // Estado: Menu Principal
  private async handleMenuHome(context: FlowContext, message: string): Promise<FlowMessage[]> {
    const menuOption = this.parseMenuOption(message);
    
    if (menuOption) {
      context.currentState = 'COURSE_INFO';
      context.selectedCourse = menuOption.courseId;
      
      // Aplicar tag do menu
      context.userData.tags.push(`menu:${menuOption.slug}`);
      
      return [{
        text: this.buildCourseInfoMessage(menuOption),
        type: 'interactive',
        buttons: [
          { id: 'enroll', text: '1 - Matricular / Quero comprar' },
          { id: 'support', text: '2 - Falar com atendente' }
        ]
      }];
    }

    // Mensagem não reconhecida, mostrar menu
    return [{
      text: this.buildMainMenu(context.userData.first_name || 'Olá'),
      type: 'text'
    }];
  }

  // Estado: Informações do Curso
  private async handleCourseInfo(context: FlowContext, message: string): Promise<FlowMessage[]> {
    // Usuário já viu as informações, processar escolha do menu secundário
    return this.handleSecondaryMenu(context, message);
  }

  // Estado: Menu Secundário
  private async handleSecondaryMenu(context: FlowContext, message: string): Promise<FlowMessage[]> {
    const choice = message.trim();
    
    if (choice === '1' || choice.toLowerCase().includes('matricular') || choice.toLowerCase().includes('comprar')) {
      // Verificar se tem dados necessários
      if (!context.userData.name) {
        context.currentState = 'COLLECT_NAME';
        return [{
          text: 'Para prosseguir com a matrícula, como podemos te chamar? 😊',
          type: 'text'
        }];
      }
      
      if (!context.userData.email) {
        context.currentState = 'COLLECT_EMAIL';
        return [{
          text: 'Qual seu melhor e-mail para enviarmos as informações? 📧',
          type: 'text'
        }];
      }
      
      context.currentState = 'ENROLLMENT';
      return this.handleEnrollment(context, 'iniciar_matricula');
    }
    
    if (choice === '2' || choice.toLowerCase().includes('atendente')) {
      context.currentState = 'SAC_IA';
      return [{
        text: 'Perfeito! Sou a assistente virtual da Kohl. Como posso te ajudar? 🤖',
        type: 'text'
      }];
    }

    // Opção não reconhecida
    return [{
      text: 'Por favor, escolha uma das opções:\n1 - Matricular / Quero comprar\n2 - Falar com atendente',
      type: 'text'
    }];
  }

  // Estado: Coleta de Nome
  private async handleCollectName(context: FlowContext, message: string): Promise<FlowMessage[]> {
    const name = message.trim();
    if (name.length < 2) {
      return [{
        text: 'Por favor, digite seu nome completo:',
        type: 'text'
      }];
    }

    context.userData.name = name;
    context.userData.first_name = name.split(' ')[0];
    
    // Verificar se precisa do email
    if (!context.userData.email) {
      context.currentState = 'COLLECT_EMAIL';
      return [{
        text: `Obrigado, ${context.userData.first_name}! Qual seu melhor e-mail? 📧`,
        type: 'text'
      }];
    }
    
    // Ir para matrícula
    context.currentState = 'ENROLLMENT';
    return this.handleEnrollment(context, 'iniciar_matricula');
  }

  // Estado: Coleta de Email
  private async handleCollectEmail(context: FlowContext, message: string): Promise<FlowMessage[]> {
    const email = message.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return [{
        text: 'Por favor, digite um e-mail válido (ex: seuemail@gmail.com):',
        type: 'text'
      }];
    }

    context.userData.email = email;
    context.currentState = 'ENROLLMENT';
    
    return this.handleEnrollment(context, 'iniciar_matricula');
  }

  // Estado: Processo de Matrícula
  private async handleEnrollment(context: FlowContext, message: string): Promise<FlowMessage[]> {
    if (message === 'iniciar_matricula') {
      return [{
        text: `Perfeito, ${context.userData.first_name}! 🎉\n\nVamos finalizar sua matrícula no curso ${context.selectedCourse}.\n\nEm breve nossa equipe entrará em contato pelo WhatsApp para confirmar os detalhes e formas de pagamento.\n\nTem alguma dúvida sobre o curso?`,
        type: 'text'
      }];
    }

    // Se tiver dúvidas durante matrícula, usar IA
    const aiRequest: AIRequest = {
      message,
      persona: 'Você é a assistente de matrículas da Kohl. Ajude com dúvidas sobre cursos, preços, formas de pagamento e processo de matrícula.',
      userContext: context.userData
    };

    const aiResponse = await this.openaiClient.askAI(aiRequest);
    
    if (aiResponse.shouldEscalate) {
      context.currentState = 'HANDOFF_HUMAN';
      return [{
        text: aiResponse.response,
        type: 'text'
      }];
    }

    return [{
      text: aiResponse.response + '\n\nPosso ajudar com mais alguma coisa sobre sua matrícula?',
      type: 'text'
    }];
  }

  // Estado: SAC com IA
  private async handleSacIA(context: FlowContext, message: string): Promise<FlowMessage[]> {
    const aiRequest: AIRequest = {
      message,
      persona: 'Você é a assistente virtual da Kohl, especializada em cursos de beleza. Seja prestativa, profissional e sempre promova nossos cursos quando apropriado.',
      userContext: context.userData,
      ragContext: {
        faqs: [
          {
            question: 'Quais são as formas de pagamento?',
            answer: 'Aceitamos dinheiro, cartões de crédito (até 12x), PIX e transferências bancárias.',
            category: 'pagamento'
          },
          {
            question: 'Preciso de experiência prévia?',
            answer: 'Não é necessária experiência prévia. Nossos cursos começam do básico.',
            category: 'requisitos'
          }
        ],
        documents: [],
        courseInfo: [
          {
            name: 'Nanoblading',
            description: 'Técnica ultra-fina para sobrancelhas naturais',
            price: 1000
          },
          {
            name: 'Microblading',
            description: 'Técnica semi-permanente com lâmina manual',
            price: 1200
          }
        ]
      }
    };

    const aiResponse = await this.openaiClient.askAI(aiRequest);
    
    if (aiResponse.shouldEscalate) {
      context.currentState = 'HANDOFF_HUMAN';
      return [{
        text: aiResponse.response,
        type: 'text'
      }];
    }

    return [{
      text: aiResponse.response,
      type: 'text'
    }];
  }

  // Utilitários
  private parseMenuOption(message: string): { courseId: string; slug: string } | null {
    const option = parseInt(message.trim());
    
    const menuMap: Record<number, { courseId: string; slug: string }> = {
      1: { courseId: 'all-eyebrow', slug: 'todos-cursos-sobrancelha' },
      2: { courseId: 'microblading', slug: 'microblading' },
      3: { courseId: 'dual-nano-micro', slug: 'dual-nano-micro' },
      4: { courseId: 'nanoblading', slug: 'nanoblading' },
      5: { courseId: 'nanolips', slug: 'nanolips' },
      6: { courseId: 'bb-glow', slug: 'bb-glow' },
      7: { courseId: 'scar-stretch-camouflage', slug: 'cicatrizes-estrias' },
      8: { courseId: 'areola-harmonization', slug: 'harmonizacao-areola' },
      9: { courseId: 'quefren-13-techniques', slug: 'quefren-13-tecnicas' },
      10: { courseId: 'nanoliner', slug: 'nanoliner' }
    };

    return menuMap[option] || null;
  }

  private buildMainMenu(firstName: string): string {
    return `${firstName}, bem-vindo(a) à Kohl 👋

Selecione o número do curso de seu interesse:

1 - Todos os Cursos de Sobrancelha
2 - Microblading  
3 - Dual Course Nano and Microblading
4 - Nanoblading
5 - NanoLips (Micro Labial)
6 - BB Glow
7 - Scar and Stretch Mark Camouflage
8 - Areola Harmonization
9 - Quéfren – 13 Eyebrow Techniques
10 - Nanoliner (Permanent Eyes)
11 - 👩‍💼 Falar com Atendente`;
  }

  private buildCourseInfoMessage(option: { courseId: string; slug: string }): string {
    // Mock course info - em produção, buscar do banco
    const courseInfo: Record<string, any> = {
      'nanoblading': {
        name: 'Nanoblading',
        description: 'Técnica ultra-fina para sobrancelhas naturais',
        duration: '2 dias',
        price: 'R$ 1.000',
        features: ['Certificado', 'Kit completo', 'Suporte 6 meses']
      },
      'microblading': {
        name: 'Microblading',
        description: 'Técnica semi-permanente com lâmina manual',
        duration: '3 dias',
        price: 'R$ 1.200',
        features: ['Certificado', 'Kit profissional', 'Prática supervisionada']
      }
    };

    const course = courseInfo[option.slug] || courseInfo['nanoblading'];
    
    return `✨ **${course.name}** ✨

${course.description}

📅 Duração: ${course.duration}
💰 Investimento: ${course.price}
✅ ${course.features.join(' • ')}

Escolha uma opção:
1 - Matricular / Quero comprar
2 - Falar com atendente`;
  }

  // Obter contexto do usuário
  getContext(userId: string): FlowContext | undefined {
    return this.contexts.get(userId);
  }

  // Limpar contexto (logout/reset)
  clearContext(userId: string): void {
    this.contexts.delete(userId);
  }

  // Atualizar dados do usuário
  updateUserData(userId: string, data: Partial<FlowContext['userData']>): void {
    const context = this.contexts.get(userId);
    if (context) {
      context.userData = { ...context.userData, ...data };
      this.contexts.set(userId, context);
    }
  }
}