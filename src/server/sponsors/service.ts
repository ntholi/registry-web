import { sponsors } from '@/db/schema';
import SponsorRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type Sponsor = typeof sponsors.$inferInsert;

class SponsorService {
  constructor(private readonly repository = new SponsorRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), ['all']);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['all']);
  }

  async findAll(params: FindAllParams<typeof sponsors>) {
    return withAuth(async () => this.repository.findAll(params), ['all']);
  }

  async create(data: Sponsor) {
    return withAuth(
      async () => this.repository.create(data),
      ['admin', 'finance'],
    );
  }

  async update(id: number, data: Sponsor) {
    return withAuth(
      async () => this.repository.update(id, data),
      ['admin', 'finance'],
    );
  }

  async delete(id: number) {
    return withAuth(
      async () => this.repository.delete(id),
      ['admin', 'finance'],
    );
  }

  async getSponsoredStudent(stdNo: number) {
    return withAuth(
      async () => this.repository.findSponsoredStudent(stdNo),
      ['all'],
    );
  }

  async count() {
    return withAuth(async () => this.repository.count(), ['all']);
  }
}

export const sponsorsService = new SponsorService();
