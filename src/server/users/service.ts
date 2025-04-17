import { users } from '@/db/schema';
import UserRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '@/server/base/serviceWrapper';

type User = typeof users.$inferInsert;

class UserService {
  constructor(private readonly repository = new UserRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), ['dashboard']);
  }

  async findAll(params: QueryOptions<typeof users>) {
    return withAuth(async () => this.repository.query(params), ['dashboard']);
  }

  async create(data: User) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: string, data: User) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: string) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const usersService = serviceWrapper(UserService, 'UsersService');
