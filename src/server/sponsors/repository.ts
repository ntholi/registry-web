import BaseRepository from '@/server/base/BaseRepository';
import { sponsors, sponsoredStudents } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

export default class SponsorRepository extends BaseRepository<
  typeof sponsors,
  'id'
> {
  constructor() {
    super(sponsors, 'id');
  }

  async findSponsoredStudent(stdNo: number) {
    const data = await db.query.sponsoredStudents.findFirst({
      where: eq(sponsoredStudents.stdNo, stdNo),
      with: {
        sponsor: true,
      },
    });

    console.log('Sponsored Student', data);

    return data;
  }
}

export const sponsorsRepository = new SponsorRepository();
