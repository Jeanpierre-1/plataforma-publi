export interface ServiceOffering {
  readonly title: string;
  readonly description: string;
}

export interface ServiceQuestion {
  readonly question: string;
  readonly answer: string;
}

export interface ServiceContent {
  readonly path: '/eventos' | '/impresiones';
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly theme: 'events' | 'print';
  readonly image: { readonly src: string; readonly alt: string; readonly caption: string };
  readonly introduction: { readonly title: string; readonly description: string };
  readonly offerings: readonly ServiceOffering[];
  readonly preparation: readonly ServiceOffering[];
  readonly questions: readonly ServiceQuestion[];
  readonly related: {
    readonly path: string;
    readonly title: string;
    readonly description: string;
    readonly label: string;
  };
}

export const EVENTS_CONTENT: ServiceContent = {
  path: '/eventos',
  label: 'Eventos',
  title: 'Eventos musicales',
  description:
    'Organización y producción de eventos de cumbia y folklore. Dale forma a un encuentro donde la música sea el punto de partida.',
  theme: 'events',
  image: {
    src: '/images/events-concept.svg',
    alt: 'Ilustración de un escenario con un arco coral, luces y formas geométricas.',
    caption: 'Ilustración conceptual de un escenario. No corresponde a un evento realizado.',
  },
  introduction: {
    title: 'Cumbia y folklore, con identidad propia.',
    description:
      'Sanabria Group organiza y produce eventos musicales. El formato, la fecha, el lugar y las necesidades de producción se definen para cada proyecto.',
  },
  offerings: [
    {
      title: 'Cumbia',
      description:
        'Organización y producción de encuentros alrededor de la cumbia. La música, el público y el propósito del evento marcan el punto de partida.',
    },
    {
      title: 'Folklore',
      description:
        'Eventos que dan espacio a la música y a las expresiones del folklore. Una propuesta que se construye según la identidad de cada encuentro.',
    },
  ],
  preparation: [
    {
      title: 'Género y formato',
      description: 'Cumbia o folklore, el tipo de encuentro y el público que esperas reunir.',
    },
    {
      title: 'Fecha y lugar',
      description: 'La fecha tentativa, la ubicación y las características del espacio.',
    },
    {
      title: 'Organización y producción',
      description: 'Qué necesitas coordinar o producir y qué aspectos ya tienes resueltos.',
    },
    {
      title: 'Referencias y alcance',
      description: 'Tus ideas para el evento y el alcance aproximado que tienes en mente.',
    },
  ],
  questions: [
    {
      question: '¿Qué tipos de eventos musicales realizan?',
      answer:
        'Sanabria Group trabaja en la organización y producción de eventos musicales de cumbia y folklore. El alcance se define según las necesidades de cada proyecto.',
    },
    {
      question: '¿Puedo considerar publicidad impresa para mi evento?',
      answer:
        'La empresa también realiza paneles, pasacalles y gigantografías. Puedes considerar ambas líneas al definir lo que necesita tu evento.',
    },
    {
      question: '¿Dónde puedo enviar una solicitud?',
      answer:
        'Las solicitudes para eventos desde esta web todavía no están habilitadas. En cotizaciones puedes calcular una estimación de gigantografías para la publicidad de tu evento.',
    },
  ],
  related: {
    path: '/impresiones',
    title: 'Que tu evento también se vea.',
    description: 'Paneles, pasacalles y gigantografías para comunicar tu mensaje a gran escala.',
    label: 'Conocer las impresiones',
  },
};

export const PRINT_CONTENT: ServiceContent = {
  path: '/impresiones',
  label: 'Impresiones',
  title: 'Gigantografías e impresiones',
  description:
    'Paneles, pasacalles y gigantografías para dar presencia a tu mensaje. Define la pieza, el espacio y la escala de tu próxima idea.',
  theme: 'print',
  image: {
    src: '/images/print-concept.svg',
    alt: 'Ilustración de un panel, un pasacalle y piezas gráficas de gran formato.',
    caption: 'Composición gráfica conceptual. No corresponde a un trabajo de cliente.',
  },
  introduction: {
    title: 'Tres formatos. Un mensaje con presencia.',
    description:
      'De la idea al soporte gráfico. Estas son las líneas de impresión de Sanabria Group; sus medidas y características se confirman según cada proyecto.',
  },
  offerings: [
    {
      title: 'Paneles',
      description:
        'Piezas gráficas para presentar una marca, un evento o un mensaje en el espacio elegido.',
    },
    {
      title: 'Pasacalles',
      description:
        'Impresiones para comunicar un evento o una campaña. El contenido, las medidas y las características se definen para cada pieza.',
    },
    {
      title: 'Gigantografías',
      description:
        'Gráfica de gran tamaño para llevar tu diseño a otra escala, considerando sus dimensiones y el uso previsto.',
    },
  ],
  preparation: [
    {
      title: 'Tipo de pieza y cantidad',
      description:
        'Indica si necesitas paneles, pasacalles o gigantografías, y cuántas piezas tienes previstas.',
    },
    {
      title: 'Medidas y ubicación',
      description:
        'Reúne el ancho, el alto y una descripción del lugar donde se utilizará la impresión.',
    },
    {
      title: 'Diseño y referencias',
      description:
        'Ten a mano los archivos disponibles, el mensaje principal y tus referencias visuales.',
    },
    {
      title: 'Fecha prevista',
      description:
        'Define para cuándo necesitas las piezas y qué aspectos del proyecto faltan por confirmar.',
    },
  ],
  questions: [
    {
      question: '¿Qué productos de impresión realizan?',
      answer:
        'Sanabria Group realiza paneles, pasacalles y gigantografías de gran formato. Las dimensiones y características se acuerdan para cada proyecto.',
    },
    {
      question: '¿Qué materiales y acabados están disponibles?',
      answer:
        'Los materiales, acabados y medidas se confirman según el uso y el alcance del proyecto. La información técnica se publicará cuando esté validada.',
    },
    {
      question: '¿Puedo enviar mis archivos desde esta página?',
      answer:
        'La recepción de archivos todavía no está habilitada. En cotizaciones puedes calcular una estimación de tu gigantografía con ancho, alto, precio por m² y listones opcionales.',
    },
  ],
  related: {
    path: '/eventos',
    title: 'De la gráfica al encuentro.',
    description: 'Conoce la organización y producción de eventos musicales de cumbia y folklore.',
    label: 'Conocer los eventos',
  },
};
