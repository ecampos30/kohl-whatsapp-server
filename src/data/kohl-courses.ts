import { CourseInfo, MenuTemplate, FAQ } from '../types/kohl-system';

export const kohlCourses: CourseInfo[] = [
  {
    id: 'all-eyebrow',
    name: 'All Eyebrow Courses',
    description: 'Complete eyebrow transformation package including multiple techniques',
    price: 2500,
    duration: '5 days intensive',
    prerequisites: [],
    syllabus: [
      'Eyebrow mapping and design',
      'Color theory and pigment selection',
      'Skin analysis and preparation',
      'Multiple application techniques',
      'Aftercare and healing process'
    ],
    nextDates: ['2025-02-15', '2025-03-10', '2025-04-05'],
    instructor: 'Master Kohl',
    materials: ['Professional kit', 'Pigments', 'Practice skins', 'Certificate']
  },
  {
    id: 'microblading',
    name: 'Microblading',
    description: 'Semi-permanent eyebrow technique using manual blade',
    price: 1200,
    duration: '3 days',
    prerequisites: [],
    syllabus: [
      'Microblading fundamentals',
      'Blade techniques and strokes',
      'Pigment selection',
      'Client consultation',
      'Safety and hygiene protocols'
    ],
    nextDates: ['2025-02-08', '2025-02-22', '2025-03-08'],
    instructor: 'Specialist Ana',
    materials: ['Microblading kit', 'Pigments', 'Practice materials']
  },
  {
    id: 'dual-nano-micro',
    name: 'Dual Course Nano and Microblading',
    description: 'Combined course covering both nano and microblading techniques',
    price: 1800,
    duration: '4 days',
    prerequisites: [],
    syllabus: [
      'Nano technique fundamentals',
      'Microblading mastery',
      'When to use each technique',
      'Combination approaches',
      'Advanced troubleshooting'
    ],
    nextDates: ['2025-02-12', '2025-03-05', '2025-03-26'],
    instructor: 'Master Kohl',
    materials: ['Complete dual kit', 'Pigment collection', 'Practice materials']
  },
  {
    id: 'nanoblading',
    name: 'Nanoblading',
    description: 'Ultra-fine hair stroke technique using nano needles',
    price: 1000,
    duration: '2 days',
    prerequisites: [],
    syllabus: [
      'Nano needle techniques',
      'Ultra-fine stroke creation',
      'Precision and control',
      'Healing optimization',
      'Client aftercare'
    ],
    nextDates: ['2025-02-06', '2025-02-20', '2025-03-06'],
    instructor: 'Specialist Carlos',
    materials: ['Nano equipment', 'Specialized pigments', 'Practice kit']
  },
  {
    id: 'nanolips',
    name: 'NanoLips (Micro Labial)',
    description: 'Lip enhancement and color correction technique',
    price: 900,
    duration: '2 days',
    prerequisites: [],
    syllabus: [
      'Lip anatomy and structure',
      'Color correction techniques',
      'Nano lip application',
      'Healing and touch-ups',
      'Client consultation for lips'
    ],
    nextDates: ['2025-02-10', '2025-02-24', '2025-03-10'],
    instructor: 'Specialist Maria',
    materials: ['Lip pigments', 'Nano tools', 'Numbing products']
  },
  {
    id: 'bb-glow',
    name: 'BB Glow',
    description: 'Skin tinting treatment for natural glow effect',
    price: 800,
    duration: '1 day intensive',
    prerequisites: [],
    syllabus: [
      'BB Glow technique',
      'Skin preparation',
      'Color matching',
      'Application methods',
      'Aftercare protocols'
    ],
    nextDates: ['2025-02-07', '2025-02-21', '2025-03-07'],
    instructor: 'Specialist Laura',
    materials: ['BB serums', 'Application tools', 'Aftercare products']
  },
  {
    id: 'scar-stretch-camouflage',
    name: 'Scar and Stretch Mark Camouflage',
    description: 'Paramedical tattooing for scar and stretch mark coverage',
    price: 1100,
    duration: '2 days',
    prerequisites: ['Basic tattooing knowledge recommended'],
    syllabus: [
      'Scar tissue analysis',
      'Color matching for skin tones',
      'Camouflage techniques',
      'Stretch mark treatment',
      'Client psychology and care'
    ],
    nextDates: ['2025-02-13', '2025-02-27', '2025-03-13'],
    instructor: 'Specialist Roberto',
    materials: ['Camouflage pigments', 'Specialized needles', 'Color wheel']
  },
  {
    id: 'areola-harmonization',
    name: 'Areola Harmonization',
    description: 'Reconstructive areola tattooing for medical and aesthetic purposes',
    price: 1300,
    duration: '2 days',
    prerequisites: ['Medical clearance required'],
    syllabus: [
      'Areola anatomy',
      'Reconstruction techniques',
      'Color theory for areolas',
      '3D nipple creation',
      'Post-surgical considerations'
    ],
    nextDates: ['2025-02-14', '2025-02-28', '2025-03-14'],
    instructor: 'Master Kohl',
    materials: ['Medical-grade pigments', 'Specialized equipment', 'Aftercare kit']
  },
  {
    id: 'quefren-13-techniques',
    name: 'Quéfren – 13 Eyebrow Techniques',
    description: 'Comprehensive course covering 13 different eyebrow techniques',
    price: 2200,
    duration: '5 days intensive',
    prerequisites: [],
    syllabus: [
      'Traditional microblading',
      'Nano technique',
      'Powder brows',
      'Ombre technique',
      'Combination methods',
      'Advanced corrections',
      'Color theory mastery',
      'Business development'
    ],
    nextDates: ['2025-02-17', '2025-03-17', '2025-04-14'],
    instructor: 'Master Quéfren',
    materials: ['Complete professional kit', 'All pigment colors', 'Business materials']
  },
  {
    id: 'nanoliner',
    name: 'Nanoliner (Permanent Eyes)',
    description: 'Permanent eyeliner application using nano techniques',
    price: 950,
    duration: '2 days',
    prerequisites: [],
    syllabus: [
      'Eye anatomy and safety',
      'Eyeliner design principles',
      'Nano application techniques',
      'Color selection for eyes',
      'Healing and touch-up protocols'
    ],
    nextDates: ['2025-02-11', '2025-02-25', '2025-03-11'],
    instructor: 'Specialist Patricia',
    materials: ['Eye-safe pigments', 'Nano liners', 'Safety equipment']
  }
];

export const defaultMenuTemplate: MenuTemplate = {
  id: 'kohl-main-menu',
  name: 'Kohl Main Menu',
  whatsappId: '',
  isActive: true,
  welcomeMessage: '{{name}}, bem-vindo(a) à Kohl 👋\n\nSelecione o número do curso de seu interesse:',
  options: [
    {
      id: '1',
      number: '1',
      text: 'Todos os Cursos de Sobrancelha',
      action: 'course_info',
      courseId: 'all-eyebrow'
    },
    {
      id: '2',
      number: '2',
      text: '👩‍💼 Falar com Atendente',
      action: 'course_info',
      courseId: 'microblading'
    },
    {
      id: '3',
      number: '3',
      text: 'Dual Course Nano and Microblading',
      action: 'course_info',
      courseId: 'dual-nano-micro'
    },
    {
      id: '4',
      number: '4',
      text: 'Nanoblading',
      action: 'course_info',
      courseId: 'nanoblading'
    },
    {
      id: '5',
      number: '5',
      text: 'NanoLips (Micro Labial)',
      action: 'course_info',
      courseId: 'nanolips'
    },
    {
      id: '6',
      number: '6',
      text: 'BB Glow',
      action: 'course_info',
      courseId: 'bb-glow'
    },
    {
      id: '7',
      number: '7',
      text: 'Scar and Stretch Mark Camouflage',
      action: 'course_info',
      courseId: 'scar-stretch-camouflage'
    },
    {
      id: '8',
      number: '8',
      text: 'Areola Harmonization',
      action: 'course_info',
      courseId: 'areola-harmonization'
    },
    {
      id: '9',
      number: '9',
      text: 'Quéfren – 13 Eyebrow Techniques',
      action: 'course_info',
      courseId: 'quefren-13-techniques'
    },
    {
      id: '10',
      number: '10',
      text: 'Nanoliner (Permanent Eyes)',
      action: 'course_info',
      courseId: 'nanoliner'
    }
  ],
  fallbackMessage: 'Desculpe, não entendi essa opção. Por favor, selecione um número de 1-11, ou digite "menu" para ver as opções novamente.',
  escalationOption: {
    id: '11',
    number: '11',
    text: '👩‍💼 Falar com Atendente',
    action: 'escalate'
  }
};

export const kohlFAQs: FAQ[] = [
  {
    id: 'faq-1',
    question: 'Quais são as opções de pagamento para os cursos?',
    answer: 'Aceitamos dinheiro, cartões de crédito (até 12x), PIX e transferências bancárias. Também oferecemos opções especiais de financiamento para múltiplos cursos.',
    category: 'pagamento',
    tags: ['pagamento', 'financiamento', 'parcelamento'],
    priority: 1
  },
  {
    id: 'faq-2',
    question: 'Preciso de experiência prévia para fazer os cursos?',
    answer: 'Não é necessária experiência prévia para a maioria dos nossos cursos. Começamos do básico e progredimos para técnicas avançadas. Alguns cursos especializados podem ter pré-requisitos.',
    category: 'requisitos',
    tags: ['experiencia', 'pre-requisitos', 'iniciante'],
    priority: 1
  },
  {
    id: 'faq-3',
    question: 'Quais materiais estão inclusos no curso?',
    answer: 'Cada curso inclui um kit profissional completo com todas as ferramentas necessárias, pigmentos, materiais de prática e certificado de conclusão.',
    category: 'materiais',
    tags: ['kit', 'materiais', 'certificado'],
    priority: 1
  },
  {
    id: 'faq-4',
    question: 'Quanto tempo leva para completar um curso?',
    answer: 'A duração dos cursos varia de 1 dia (BB Glow) a 5 dias (cursos abrangentes). A maioria dos cursos são treinamentos intensivos de 2-3 dias.',
    category: 'duracao',
    tags: ['duracao', 'cronograma', 'intensivo'],
    priority: 1
  },
  {
    id: 'faq-5',
    question: 'Vocês oferecem suporte contínuo após o curso?',
    answer: 'Sim! Oferecemos 6 meses de suporte via WhatsApp, acesso ao nosso grupo exclusivo de alunos e sessões de atualização.',
    category: 'suporte',
    tags: ['suporte', 'pos-curso', 'comunidade'],
    priority: 1
  }
];