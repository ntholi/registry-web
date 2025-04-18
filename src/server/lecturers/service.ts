import { lecturers } from '@/db/schema';
import LecturerRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';

type Lecturer = typeof lecturers.$inferInsert;

class LecturerService {
  constructor(private readonly repository = new LecturerRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof lecturers>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: Lecturer) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: Lecturer) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const lecturersService = new LecturerService();
