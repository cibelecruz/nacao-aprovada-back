import { right, type Either } from '../../shared/utils/Either.js';
import { ID } from '../Id.js';

type SubjectInSimulation = {
  id: ID;
  name: string;
  totalQuestions: number;
  correctQuestions: number;
};

type SimulationProps = {
  id: ID;
  userId: ID;
  name: string;
  subjects: SubjectInSimulation[];
  date: string;
};

type SubjectInSimulationData = {
  id?: ID;
  name: string;
  totalQuestions: number;
  correctQuestions: number;
};

type SimulationDataProps = {
  id?: ID;
  userId: ID;
  name: string;
  subjects: SubjectInSimulationData[];
  date: string;
};

export class Simulation {
  private constructor(private _data: SimulationProps) {}

  updateName(name: string): void {
    this._data.name = name;
  }

  updateDate(date: string): void {
    this._data.date = date;
  }

  updateNameSubject(id: ID, name: string): void {
    const subjectIndex = this._data.subjects.findIndex((s) => s.id === id);

    this._data.subjects[subjectIndex].name = name;
  }

  updateTotalQuestionsSubject(id: ID, totalQuestions: number): void {
    const subjectIndex = this._data.subjects.findIndex((s) => s.id === id);

    this._data.subjects[subjectIndex].totalQuestions = totalQuestions;
  }

  updateCorrectQuestionsSubject(id: ID, correctQuestions: number): void {
    const subjectIndex = this._data.subjects.findIndex((s) => s.id === id);

    this._data.subjects[subjectIndex].correctQuestions = correctQuestions;
  }

  findSubjectById(id: ID): SubjectInSimulation | null {
    const subjectById = this.data.subjects.find((s) => s.id === id);

    if (!subjectById) {
      return null;
    }

    return subjectById;
  }

  addSubject(subjectData: SubjectInSimulationData): void {
    const subjectOrError = Simulation.createSubjectInSimulation(subjectData);

    if (subjectOrError.isRight()) {
      this._data.subjects.push(subjectOrError.value);
    }
  }

  removeSubject(id: ID): void {
    this._data.subjects = this._data.subjects.filter((s) => s.id !== id);
  }

  removeAllSubjects(): void {
    this._data.subjects = [];
  }

  get data() {
    return this._data;
  }

  static createSubjectInSimulation(
    data: SubjectInSimulationData,
  ): Either<never, SubjectInSimulation> {
    return right({
      id: data.id ?? ID.create(),
      name: data.name,
      totalQuestions: data.totalQuestions,
      correctQuestions: data.correctQuestions,
    });
  }

  static create(data: SimulationDataProps): Either<never, Simulation> {
    return right(
      new Simulation({
        id: data.id ?? ID.create(),
        userId: data.userId,
        name: data.name,
        subjects: data.subjects.map((s) => ({
          id: s.id ?? ID.create(),
          correctQuestions: s.correctQuestions,
          totalQuestions: s.totalQuestions,
          name: s.name,
        })),
        date: data.date,
      }),
    );
  }
}
