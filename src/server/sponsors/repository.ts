import BaseRepository from '@/server/base/BaseRepository';
import {
  sponsors,
  sponsoredStudents,
  studentPrograms,
  students,
} from '@/db/schema';
import { db } from '@/db';
import { and, eq, desc, sql, or, like, inArray } from 'drizzle-orm';

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
      eq(sponsoredStudents.stdNo, stdNo)
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

  async findSponsoredStudentsBySponsor(
    sponsorId: string,
    params?: { page?: number; limit?: number; search?: string }
  ) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const baseCondition = eq(sponsoredStudents.sponsorId, Number(sponsorId));
    let whereCondition = baseCondition;

    if (params?.search) {
      const searchCondition = or(
        like(students.name, `%${params.search}%`),
        like(sql`CAST(${students.stdNo} AS TEXT)`, `%${params.search}%`),
        like(sponsoredStudents.borrowerNo, `%${params.search}%`)
      );
      whereCondition = and(baseCondition, searchCondition)!;
    }

    const totalItemsQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(sponsoredStudents)
      .innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo));

    if (params?.search) {
      totalItemsQuery.where(whereCondition);
    } else {
      totalItemsQuery.where(eq(sponsoredStudents.sponsorId, Number(sponsorId)));
    }

    const totalItems = await totalItemsQuery.then(
      (result) => result[0]?.count || 0
    );

    const itemsQuery = db
      .select()
      .from(sponsoredStudents)
      .innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(sponsoredStudents.createdAt));

    if (params?.search) {
      itemsQuery.where(whereCondition);
    } else {
      itemsQuery.where(eq(sponsoredStudents.sponsorId, Number(sponsorId)));
    }

    const rawItems = await itemsQuery;

    // Get the sponsored student IDs to fetch relations
    const sponsoredStudentIds = rawItems.map(
      (item) => item.sponsored_students.id
    );

    const items = await db.query.sponsoredStudents.findMany({
      where: inArray(sponsoredStudents.id, sponsoredStudentIds),
      with: {
        student: {
          with: {
            programs: {
              where: eq(studentPrograms.status, 'Active'),
              with: {
                structure: {
                  with: {
                    program: {
                      with: {
                        school: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: desc(sponsoredStudents.createdAt),
    });

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    };
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
            eq(sponsoredStudents.stdNo, data.stdNo)
            // eq(sponsoredStudents.termId, data.termId),
          )
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
