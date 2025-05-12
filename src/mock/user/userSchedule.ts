export const userSchedule = {
  name: 'Anthony Martins',
  email: 'sda-luz@bol.com.br',
  phone: '+551939186542',
  courses: {
    'IBGE - Agente Censitário': {
      'Direito Constitucional': {
        enabled: true,
        topics: {
          'Constituição e Classificação das Constituições': {
            enabled: true,
            study: true,
            exercise: false,
            review: true,
            law_letter: true,
          },
          'Princípios Fundamentais': {
            enabled: false,
            study: true,
            exercise: true,
            review: true,
            law_letter: true,
          },
          'Direitos e Garantias Fundamentais': {
            enabled: true,
            study: false,
            exercise: false,
            review: false,
            law_letter: false,
          },
          'Organização do Estudo': {
            enabled: true,
            study: true,
            exercise: false,
            review: false,
            law_letter: true,
          },
        },
      },
      Matemática: {
        enabled: false,
        topics: {
          Aritmética: {
            enabled: true,
            study: true,
            exercise: false,
            review: true,
            law_letter: true,
          },
          Álgebra: {
            enabled: false,
            study: true,
            exercise: true,
            review: true,
            law_letter: true,
          },
          Geometria: {
            enabled: true,
            study: false,
            exercise: false,
            review: false,
            law_letter: false,
          },
          'Organização do Estudo': {
            enabled: true,
            study: true,
            exercise: false,
            review: false,
            law_letter: true,
          },
        },
      },
    },
    'PRF - Policial Rodoviário': {
      Português: {
        enabled: true,
        topics: {
          'Interpretação de Texto': {
            enabled: true,
            study: true,
            exercise: false,
            review: true,
            law_letter: true,
          },
          Ortografia: {
            enabled: false,
            study: true,
            exercise: true,
            review: true,
            law_letter: true,
          },
          'Acentuação Gráfica': {
            enabled: true,
            study: false,
            exercise: false,
            review: false,
            law_letter: false,
          },
          'Organização do Estudo': {
            enabled: true,
            study: true,
            exercise: false,
            review: false,
            law_letter: true,
          },
        },
      },
      'Direito Eleitoral': {
        enabled: false,
        topics: {
          'Direito Eleitoral': {
            enabled: true,
            study: true,
            exercise: false,
            review: true,
            law_letter: true,
          },
          'Direitos Políticos': {
            enabled: false,
            study: true,
            exercise: true,
            review: true,
            law_letter: true,
          },
          'Partidos Políticos': {
            enabled: true,
            study: false,
            exercise: false,
            review: false,
            law_letter: false,
          },
          'Organização do Estudo': {
            enabled: true,
            study: true,
            exercise: false,
            review: false,
            law_letter: true,
          },
        },
      },
    },
  },
};
