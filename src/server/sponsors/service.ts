import { sponsors } from '@/db/schema';
import SponsorRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type Sponsor = typeof sponsors.$inferInsert;

class SponsorService {
  constructor(private readonly repository = new SponsorRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async findAll(params: FindAllParams<typeof sponsors>) {
    return withAuth(async () => this.repository.findAll(params), []);
  }

  async create(data: Sponsor) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: Sponsor) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const sponsorsService = new SponsorService();
