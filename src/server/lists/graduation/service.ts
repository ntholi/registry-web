import { graduationLists } from '@/db/schema';
import GraduationListRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../../base/BaseRepository';
import { serviceWrapper } from '../../base/serviceWrapper';

type GraduationList = typeof graduationLists.$inferInsert;

class GraduationListService {
  constructor(private readonly repository = new GraduationListRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof graduationLists>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: GraduationList) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: string, data: GraduationList) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: string) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const graduationListsService = serviceWrapper(
  GraduationListService,
  'GraduationList'
);
