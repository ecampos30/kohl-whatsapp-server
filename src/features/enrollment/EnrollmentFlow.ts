// Fluxo de matrícula com coleta de dados
export interface EnrollmentData {
  leadId: string;
  courseId: string;
  courseName: string;
  studentInfo: {
    name: string;
    email: string;
    phone: string;
    city?: string;
    state?: string;
  };
  preferences: {
    paymentMethod?: 'pix' | 'credit_card' | 'cash' | 'bank_transfer';
    installments?: number;
    startDate?: string;
    modality?: 'presencial' | 'online' | 'hibrido';
  };
  status: 'iniciado' | 'dados_coletados' | 'pagamento_pendente' | 'confirmado' | 'cancelado';
  createdAt: string;
  updatedAt: string;
}

export class EnrollmentFlow {
  private enrollments: Map<string, EnrollmentData> = new Map();

  // Iniciar processo de matrícula
  async startEnrollment(
    leadId: string, 
    courseId: string, 
    courseName: string,
    studentInfo: EnrollmentData['studentInfo']
  ): Promise<EnrollmentData> {
    const enrollment: EnrollmentData = {
      leadId,
      courseId,
      courseName,
      studentInfo,
      preferences: {},
      status: 'iniciado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.enrollments.set(leadId, enrollment);
    console.log('[EnrollmentFlow] Matrícula iniciada:', enrollment);

    return enrollment;
  }

  // Atualizar dados da matrícula
  async updateEnrollment(
    leadId: string, 
    updates: Partial<EnrollmentData>
  ): Promise<EnrollmentData | null> {
    const enrollment = this.enrollments.get(leadId);
    if (!enrollment) return null;

    const updatedEnrollment = {
      ...enrollment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.enrollments.set(leadId, updatedEnrollment);
    console.log('[EnrollmentFlow] Matrícula atualizada:', updatedEnrollment);

    return updatedEnrollment;
  }

  // Coletar preferências de pagamento
  async collectPaymentPreferences(leadId: string): Promise<string[]> {
    return [
      'Como você gostaria de pagar?',
      '',
      '1 - PIX (5% desconto)',
      '2 - Cartão de crédito (até 12x)',
      '3 - Dinheiro (10% desconto)',
      '4 - Transferência bancária',
      '',
      'Digite o número da sua preferência:'
    ];
  }

  // Processar escolha de pagamento
  async processPaymentChoice(leadId: string, choice: string): Promise<string> {
    const enrollment = this.enrollments.get(leadId);
    if (!enrollment) return 'Erro: matrícula não encontrada.';

    let paymentMethod: EnrollmentData['preferences']['paymentMethod'];
    let message = '';

    switch (choice.trim()) {
      case '1':
        paymentMethod = 'pix';
        message = `Excelente escolha! PIX com 5% de desconto. 💰\n\nNossa equipe entrará em contato em até 30 minutos para finalizar sua matrícula e enviar os dados para pagamento.\n\nObrigado por escolher a Kohl! 🎉`;
        break;
      case '2':
        paymentMethod = 'credit_card';
        message = `Cartão de crédito selecionado! 💳\n\nVocê pode parcelar em até 12x sem juros.\n\nNossa equipe entrará em contato para processar o pagamento e confirmar sua vaga.\n\nObrigado por escolher a Kohl! 🎉`;
        break;
      case '3':
        paymentMethod = 'cash';
        message = `Pagamento em dinheiro com 10% de desconto! 💵\n\nNossa equipe entrará em contato para combinar o local e horário para pagamento.\n\nObrigado por escolher a Kohl! 🎉`;
        break;
      case '4':
        paymentMethod = 'bank_transfer';
        message = `Transferência bancária selecionada! 🏦\n\nEnviaremos os dados bancários por e-mail e WhatsApp.\n\nNossa equipe entrará em contato para confirmar o recebimento.\n\nObrigado por escolher a Kohl! 🎉`;
        break;
      default:
        return 'Por favor, escolha uma opção válida (1, 2, 3 ou 4):';
    }

    await this.updateEnrollment(leadId, {
      preferences: { ...enrollment.preferences, paymentMethod },
      status: 'dados_coletados'
    });

    return message;
  }

  // Obter matrícula
  getEnrollment(leadId: string): EnrollmentData | null {
    return this.enrollments.get(leadId) || null;
  }

  // Listar todas as matrículas
  getAllEnrollments(): EnrollmentData[] {
    return Array.from(this.enrollments.values());
  }

  // Confirmar matrícula (chamado pelo atendente)
  async confirmEnrollment(leadId: string): Promise<boolean> {
    const enrollment = await this.updateEnrollment(leadId, {
      status: 'confirmado'
    });

    if (enrollment) {
      console.log('[EnrollmentFlow] Matrícula confirmada:', enrollment);
      return true;
    }

    return false;
  }

  // Cancelar matrícula
  async cancelEnrollment(leadId: string, reason?: string): Promise<boolean> {
    const enrollment = await this.updateEnrollment(leadId, {
      status: 'cancelado'
    });

    if (enrollment) {
      console.log('[EnrollmentFlow] Matrícula cancelada:', enrollment, 'Motivo:', reason);
      return true;
    }

    return false;
  }
}