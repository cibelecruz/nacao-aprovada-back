// FRONT

export const user = {
  name: 'John Doe',
  id: '6e71ee69-151d-4b3c-b497-459df4690c9d',
};

export const subject = [
  {
    subject: 'Língua Portuguesa',
    date: '2024-02-05',
    classification: ['Acentuação Gráfica', 'Crase'],
    description:
      'Por onde começar: conheça os primeiros passos na sua prepração.',
  },
  {
    subject: 'Língua Portuguesa',
    date: '2024-02-06',
    classification: ['Interpretação de texto', 'Redação'],
    description:
      'Por onde começar: conheça os primeiros passos na sua prepração.',
  },
  {
    subject: 'Matemática',
    date: '2024-02-09',
    classification: ['Regra de três'],
    description:
      'Por onde começar: conheça os primeiros passos na sua prepração.',
  },
];

//BD
//study-theme
// {
//     "id": "study-theme-id",
//         "name": "Nome",
//             "subjects": [
//                 {
//                     "relevance": 1,
//                     "id": "subject-id1"
//                 },
//                 {
//                     "relevance": 2,
//                     "id": "subject-id2"
//                 },
//                 {
//                     "relevance": 3,
//                     "id": "subject-id3"
//                 },
//             ]
// }

//subject
// {
//     "id": "subject-id1",
//         "classification": [
//             "Língua Portuguesa",
//             "Acentuação Gráfica"
//         ],
//             "description": "Descrição",
// }
// {
//     "id": "subject-id2",
//         "classification": [
//             "Língua Portuguesa",
//             "Crase"
//         ],
//             "description": "Descrição",
// }
// {
//     "id": "subject-id3",
//         "classification": [
//             "Matemática",
//             "Regra de três"
//         ],
//             "description": "Descrição",
// }

//user study courseStatus
// {
//     "id": "id",
//         "userId": "id",
//            "courseId": "id",
//             "subjects": [
//                 {
//                     "customRelevance": 3,
//                     "subjectId": "subject-id1"
//                 },
//                 {
//                     "customRelevance": 2,
//                     "subjectId": "subject-id2"
//                 },
//                 {
//                     "customRelevance": 3,
//                     "subjectId": "subject-id3"
//                 },
//             ],
// }

// user study availability
// {
//     "id": "id",
//         "userId": "id",
//             "week": [
//                 1,
//                 2,
//                 3,
//                 4,
//                 5,
//                 6,
//                 7
//             ],
// }

// .optimize()

//user tasks
// {
//     "id": "id",
//         "date": "17-01-2024",
//             "subjectId": "subject-id1",
// },
// {
//     "id": "id",
//         "date": "17-01-2024",
//             "subjectId": "subject-id2",
// },
// {
//     "id": "id",
//         "date": "18-01-2024",
//             " ": "subject-id3",
// },
