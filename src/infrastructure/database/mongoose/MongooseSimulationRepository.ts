import { ID } from '../../../domain/Id.js';
import type { SimulationRepository } from '../../../domain/simulation/SimulationRepository.js';
import { Simulation } from '../../../domain/simulation/Simulation.js';
import { SimulationModel } from './models/SimulationModel.js';

export class MongooseSimulationRepository implements SimulationRepository {
  async create(simulation: Simulation): Promise<void> {
    await new SimulationModel({
      _id: simulation.data.id,
      userId: simulation.data.userId,
      name: simulation.data.name,
      subjects: simulation.data.subjects.map((subject) => ({
        id: subject.id.value,
        name: subject.name,
        totalQuestions: subject.totalQuestions,
        correctQuestions: subject.correctQuestions,
      })),
      date: simulation.data.date,
      createdAt: new Date(),
    }).save();
  }

  async ofId(id: ID): Promise<Simulation | null> {
    const simulationData = await SimulationModel.findOne({ _id: id })
      .lean()
      .exec();

    if (!simulationData) {
      return null;
    }

    const simulation = Simulation.create({
      id: ID.create(simulationData._id),
      userId: ID.create(simulationData.userId),
      name: simulationData.name,
      date: simulationData.date,
      subjects: simulationData.subjects.map((subject) => ({
        id: ID.create(subject.id),
        name: subject.name,
        totalQuestions: subject.totalQuestions,
        correctQuestions: subject.correctQuestions,
      })),
    });

    return simulation.value;
  }

  async save(simulation: Simulation): Promise<void> {
    const formattedSubjects = simulation.data.subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      totalQuestions: subject.totalQuestions,
      correctQuestions: subject.correctQuestions,
    }));

    await SimulationModel.updateOne(
      { _id: simulation.data.id.value },
      {
        name: simulation.data.name,
        subjects: formattedSubjects,
        date: simulation.data.date,
      },
    ).exec();
  }

  async delete(id: ID): Promise<void> {
    await SimulationModel.deleteOne().where({ _id: id }).exec();
  }

  async findByUserId(userId: ID): Promise<Simulation[]> {
    const simulationsData = await SimulationModel.find({ userId: userId })
      .lean()
      .exec();

    return simulationsData.map(
      (simulationData) =>
        Simulation.create({
          id: ID.create(simulationData._id),
          userId: ID.create(simulationData.userId),
          name: simulationData.name,
          subjects: simulationData.subjects.map((subject) => ({
            id: ID.create(),
            name: subject.name,
            totalQuestions: subject.totalQuestions,
            correctQuestions: subject.correctQuestions,
          })),
          date: simulationData.date,
        }).value,
    );
  }
}
