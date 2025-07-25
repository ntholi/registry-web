import { sponsors } from '@/db/schema';
import SponsorRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '@/server/base/serviceWrapper';

type Sponsor = typeof sponsors.$inferInsert;

class SponsorService {
  constructor(private readonly repository = new SponsorRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), ['all']);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['all']);
  }

  async findAll(params: QueryOptions<typeof sponsors>) {
    return withAuth(async () => this.repository.query(params), ['all']);
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

  async getSponsoredStudent(stdNo: number, termId: number) {
    return withAuth(
      async () => this.repository.findSponsoredStudent(stdNo, termId),
      ['all'],
    );
  }

  async updateStudentSponsorship(data: {
    stdNo: number;
    termId: number;
    sponsorId: number;
    borrowerNo?: string;
  }) {
    return withAuth(
      async () => this.repository.upsertSponsoredStudent(data),
      ['auth'],
      async (session) => {
        if (
          ['registry', 'finance', 'admin'].includes(
            session.user?.role as string,
          )
        ) {
          return true;
        }

        if (session.user?.role === 'student') {
          return session.user.stdNo === data.stdNo;
        }

        return false;
      },
    );
  }

  async count() {
    return withAuth(async () => this.repository.count(), ['all']);
  }
}

export const sponsorsService = serviceWrapper(
  SponsorService,
  'SponsorsService',
);
