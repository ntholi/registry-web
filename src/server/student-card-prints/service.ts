import { studentCardPrints } from '@/db/schema';
import StudentCardPrintRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '../base/serviceWrapper';

type StudentCardPrint = typeof studentCardPrints.$inferInsert;

class StudentCardPrintService {
  constructor(private readonly repository = new StudentCardPrintRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof studentCardPrints>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: StudentCardPrint) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: string, data: Partial<StudentCardPrint>) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: string) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const studentCardPrintsService = serviceWrapper(
  StudentCardPrintService,
  'StudentCardPrint',
);
