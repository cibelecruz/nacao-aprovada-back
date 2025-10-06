import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { HotmartPostbackModel } from '../../database/mongoose/models/HotmartPostbackModel.js';
import { EventDispatcher } from '../../../shared/EventDispatcher.js';
import {
  HotmartPostbackReceivedEvent,
  HotmartPostbackReceivedEventData,
} from '../../../domain/events/HotmartPostbackReceivedEvent.js';
import { RegisterUserUseCase } from '../../../application/user/RegisterUserUseCase.js';
import { MongooseUserRepository } from '../../database/mongoose/MongooseUserRepository.js';
import { FirebaseAuthService } from '../../services/auth/FirebaseAuthService.js';
import { EnrollmentService } from '../../../domain/user/EnrollmentService.js';
import { MongooseCourseRepository } from '../../database/mongoose/MongooseCourseRepository.js';
import { MongooseTaskRepository } from '../../database/mongoose/MongooseTaskRepository.js';
import { MongooseUserSubjectsStatusRepository } from '../../database/mongoose/MongooseUserSubjectsStatusRepository.js';
import { Name } from '../../../domain/user/Name.js';
import { Email } from '../../../domain/user/Email.js';
import { Cpf } from '../../../domain/user/Cpf.js';
import { Phone } from '../../../domain/user/Phone.js';
import { Role } from '../../../domain/user/Role.js';
import { ID } from '../../../domain/Id.js';
import { CalendarDate } from '../../../domain/CalendarDate.js';

const eventDispatcher = EventDispatcher.getInstance();

// Interfaces para dados do postback da Hotmart
interface HotmartPostbackData {
  id: string;
  creation_date: number;
  event: string;
  version: string;
  data: {
    product: {
      id: number;
      ucode: string;
      name: string;
      warranty_date: string;
      support_email: string;
      has_co_production: boolean;
      is_physical_product: boolean;
      content: {
        has_physical_products: boolean;
        products: Array<{
          id: number;
          ucode: string;
          name: string;
          is_physical_product: boolean;
        }>;
      };
    };
    affiliates: Array<{
      affiliate_code: string;
      name: string;
    }>;
    buyer: {
      email: string;
      name: string;
      first_name: string;
      last_name: string;
      checkout_phone_code: string;
      checkout_phone: string;
      address: {
        city: string;
        country: string;
        country_iso: string;
        state: string;
        neighborhood: string;
        zipcode: string;
        address: string;
        number: string;
        complement: string;
      };
      document: string;
      document_type: string;
    };
    producer: {
      name: string;
      document: string;
      legal_nature: string;
    };
    commissions: Array<{
      value: number;
      source: string;
      currency_value: string;
    }>;
    purchase: {
      approved_date: number;
      full_price: {
        value: number;
        currency_value: string;
      };
      price: {
        value: number;
        currency_value: string;
      };
      checkout_country: {
        name: string;
        iso: string;
      };
      order_bump: {
        is_order_bump: boolean;
        parent_purchase_transaction: string;
      };
      event_tickets: {
        amount: number;
      };
      buyer_ip: string;
      original_offer_price: {
        value: number;
        currency_value: string;
      };
      order_date: number;
      status: string;
      transaction: string;
      payment: {
        installments_number: number;
        type: string;
      };
      offer: {
        code: string;
        coupon_code: string;
      };
      sckPaymentLink: string;
      is_funnel: boolean;
      business_model: string;
    };
    subscription: {
      status: string;
      plan: {
        id: number;
        name: string;
      };
      subscriber: {
        code: string;
      };
    };
  };
}

export default function (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  // Inicializar o RegisterUserUseCase
  const registerUserUseCase = new RegisterUserUseCase(
    new MongooseUserRepository(),
    new FirebaseAuthService(),
    new EnrollmentService(
      new MongooseUserRepository(),
      new MongooseCourseRepository(),
      new MongooseTaskRepository(eventDispatcher),
      new MongooseUserSubjectsStatusRepository(),
    ),
  );

  server.post('/register', async (request, reply) => {
    try {
      const postbackData = request.body as HotmartPostbackData;

      const model = await new HotmartPostbackModel({
        payload: postbackData,
        status: postbackData.event,
      }).save();

      if (postbackData.event === 'PURCHASE_COMPLETE') {
        try {
          // Extrair dados do comprador
          const buyer = postbackData.data.buyer;

          // Criar objetos de domínio
          const nameOrError = Name.create(buyer.name.trim());
          const emailOrError = Email.create(buyer.email.trim());
          const cpfOrError = Cpf.create(buyer.document.trim());
          const phoneOrError = Phone.create(buyer.checkout_phone.trim());
          const roleOrError = Role.create('student');

          // Verificar se houve erros na criação dos objetos de domínio
          if (nameOrError.isLeft()) {
            throw new Error(`Nome inválido: ${nameOrError.value.message}`);
          }
          if (emailOrError.isLeft()) {
            throw new Error(`Email inválido: ${emailOrError.value.message}`);
          }
          if (cpfOrError.isLeft()) {
            throw new Error(`CPF inválido: ${cpfOrError.value.message}`);
          }
          if (phoneOrError.isLeft()) {
            throw new Error(`Telefone inválido: ${phoneOrError.value.message}`);
          }
          if (roleOrError.isLeft()) {
            throw new Error(`Role inválido: ${roleOrError.value.message}`);
          }

          // Preparar dados do usuário
          const userData = {
            name: nameOrError.value,
            email: emailOrError.value,
            cpf: cpfOrError.value,
            phone: phoneOrError.value,
            role: roleOrError.value,
            courses: [], // Por enquanto, sem cursos específicos
          };

          // Registrar o usuário
          const result = await registerUserUseCase.execute(userData);

          if (result.isLeft()) {
            throw new Error(
              `Erro ao registrar usuário: ${result.value.message}`,
            );
          }

          console.log('Usuário registrado com sucesso:', {
            id: result.value.id.value,
            email: result.value.email.value,
          });

          // Atualizar status do postback
          model.status = 'processed';
          await model.save();
        } catch (userRegistrationError) {
          console.error('Erro ao registrar usuário:', userRegistrationError);

          // Atualizar status do postback com erro
          model.status = 'error';
          await model.save();
        }
      }

      // Disparar evento para processamento adicional
      const event = new HotmartPostbackReceivedEvent({
        ...postbackData,
        mongoId: model._id,
      } as HotmartPostbackReceivedEventData);

      eventDispatcher.dispatch(event).catch(console.error);

      return reply.status(200).send({
        message: 'Postback processado com sucesso',
        status: model.status,
      });
    } catch (error) {
      console.error('Erro geral no processamento do postback:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  });

  done();
}
