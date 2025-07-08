import { blockedStudents } from '@/db/schema';
import BlockedStudentRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '../base/serviceWrapper';

type BlockedStudent = typeof blockedStudents.$inferInsert;

class BlockedStudentService {
  constructor(private readonly repository = new BlockedStudentRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getByStdNo(stdNo: number, status: 'blocked' | 'unblocked' = 'blocked') {
    return withAuth(
      async () => this.repository.findByStdNo(stdNo, status),
      ['all'],
    );
  }

  async getAll(params: QueryOptions<typeof blockedStudents>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: BlockedStudent) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: BlockedStudent) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const blockedStudentsService = serviceWrapper(
  BlockedStudentService,
  'BlockedStudent',
);
