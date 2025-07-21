import BaseRepository from '@/server/base/BaseRepository';
import { sponsors, sponsoredStudents } from '@/db/schema';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';

export default class SponsorRepository extends BaseRepository<
  typeof sponsors,
  'id'
> {
  constructor() {
    super(sponsors, 'id');
  }

  async findSponsoredStudent(stdNo: number, termId: number) {
    console.log(`Delete this and do something with ${termId}`);
    const whereCondition = and(
      eq(sponsoredStudents.stdNo, stdNo),
      // eq(sponsoredStudents.termId, termId),
    );

    const data = await db.query.sponsoredStudents.findFirst({
      where: whereCondition,
      with: {
        sponsor: true,
      },
    });

    return data;
  }

  async upsertSponsoredStudent(data: {
    stdNo: number;
    termId: number;
    sponsorId: number;
    borrowerNo?: string;
  }) {
    const existing = await this.findSponsoredStudent(data.stdNo, data.termId);

    if (existing) {
      return await db
        .update(sponsoredStudents)
        .set({
          sponsorId: data.sponsorId,
          borrowerNo: data.borrowerNo,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(sponsoredStudents.stdNo, data.stdNo),
            // eq(sponsoredStudents.termId, data.termId),
          ),
        )
        .returning();
    } else {
      return await db
        .insert(sponsoredStudents)
        .values({
          stdNo: data.stdNo,
          // termId: data.termId,
          sponsorId: data.sponsorId,
          borrowerNo: data.borrowerNo,
        })
        .returning();
    }
  }
}

export const sponsorsRepository = new SponsorRepository();
