import { schools } from '@/db/schema';
import SchoolRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '@/server/base/serviceWrapper';

class SchoolService {
  constructor(private readonly repository = new SchoolRepository()) {}

  async findAll(params: QueryOptions<typeof schools> = {}) {
    return withAuth(async () => this.repository.query(params), ['dashboard']);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['dashboard']);
  }

  async getAll() {
    return withAuth(async () => this.repository.findAll(), ['dashboard']);
  }
}

export const schoolsService = serviceWrapper(SchoolService, 'SchoolsService');
