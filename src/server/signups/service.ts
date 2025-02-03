import { signups } from '@/db/schema';
import SignupRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type Signup = typeof signups.$inferInsert;

class SignupService {
  constructor(private readonly repository = new SignupRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(userId: string) {
    return withAuth(async () => this.repository.findById(userId), ['auth']);
  }

  async findAll(params: FindAllParams<typeof signups>) {
    return withAuth(async () => this.repository.findAll(params), []);
  }

  async create(data: Signup) {
    return withAuth(async () => this.repository.create(data), ['auth']);
  }

  async update(id: string, data: Signup) {
    return withAuth(async () => this.repository.update(id, data), ['auth']);
  }

  async delete(id: string) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const signupsService = new SignupService();
