import { db } from '@/db';
import {
  sponsoredStudents,
  sponsors,
  sponsoredTerms,
  studentPrograms,
  students,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, desc, eq, inArray, like, or, sql } from 'drizzle-orm';

type SponsoredStudent = typeof sponsoredStudents.$inferSelect;

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

  async findCurrentSponsoredStudent(stdNo: number) {
    const data = await db.query.sponsoredStudents.findFirst({
      where: eq(sponsoredStudents.stdNo, stdNo),
      with: {
        sponsor: true,
      },
      orderBy: desc(sponsoredStudents.createdAt),
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
        like(sponsoredStudents.borrowerNo, `%${params.search}%`),
        like(sponsoredStudents.bankName, `%${params.search}%`),
        like(sponsoredStudents.accountNumber, `%${params.search}%`)
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

  async findAllSponsoredStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sponsorId?: string;
    programId?: string;
    confirmed?: boolean;
    termId?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const whereConditions = [];

    if (params?.search) {
      whereConditions.push(
        or(
          like(students.name, `%${params.search}%`),
          like(sql`CAST(${students.stdNo} AS TEXT)`, `%${params.search}%`),
          like(sponsoredStudents.borrowerNo, `%${params.search}%`),
          like(sponsoredStudents.bankName, `%${params.search}%`),
          like(sponsoredStudents.accountNumber, `%${params.search}%`),
          like(sponsors.name, `%${params.search}%`)
        )
      );
    }

    if (params?.sponsorId) {
      whereConditions.push(
        eq(sponsoredStudents.sponsorId, Number(params.sponsorId))
      );
    }

    if (params?.programId) {
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM student_programs sp 
          JOIN structures s ON sp.structure_id = s.id 
          WHERE sp.std_no = ${students.stdNo} 
          AND sp.status = 'Active' 
          AND s.program_id = ${Number(params.programId)}
        )`
      );
    }

    if (params?.confirmed !== undefined) {
      whereConditions.push(eq(sponsoredStudents.confirmed, params.confirmed));
    }

    if (params?.termId) {
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM sponsored_terms st 
          WHERE st.sponsored_student_id = ${sponsoredStudents.id} 
          AND st.term_id = ${Number(params.termId)}
        )`
      );
    }

    const whereCondition =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const totalItemsQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(sponsoredStudents)
      .innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
      .innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id));

    if (whereCondition) {
      totalItemsQuery.where(whereCondition);
    }

    const totalItems = await totalItemsQuery.then(
      (result) => result[0]?.count || 0
    );

    const itemsQuery = db
      .select()
      .from(sponsoredStudents)
      .innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
      .innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(sponsoredStudents.createdAt));

    if (whereCondition) {
      itemsQuery.where(whereCondition);
    }

    const rawItems = await itemsQuery;

    // Get the sponsored student IDs to fetch relations
    const sponsoredStudentIds = rawItems.map(
      (item) => item.sponsored_students.id
    );

    const items = await db.query.sponsoredStudents.findMany({
      where: inArray(sponsoredStudents.id, sponsoredStudentIds),
      with: {
        sponsor: true,
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
    bankName?: string;
    accountNumber?: string;
    confirmed?: boolean;
  }) {
    const existing = await this.findSponsoredStudent(data.stdNo, data.termId);

    if (existing) {
      const updateData: {
        sponsorId: number;
        borrowerNo?: string;
        bankName?: string;
        accountNumber?: string;
        confirmed?: boolean;
        updatedAt: Date;
      } = {
        sponsorId: data.sponsorId,
        borrowerNo: data.borrowerNo,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        updatedAt: new Date(),
      };

      if (data.confirmed !== undefined) {
        updateData.confirmed = data.confirmed;
      }

      return await db
        .update(sponsoredStudents)
        .set(updateData)
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
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          confirmed: data.confirmed,
        })
        .returning();
    }
  }

  async updateAccountDetails(data: {
    stdNoOrName: string;
    bankName: string;
    accountNumber: string;
  }) {
    const isNumeric = !isNaN(Number(data.stdNoOrName));

    if (isNumeric) {
      const stdNo = Number(data.stdNoOrName);
      return await db
        .update(sponsoredStudents)
        .set({
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(sponsoredStudents.stdNo, stdNo))
        .returning();
    } else {
      const student = await db.query.students.findFirst({
        where: like(students.name, `%${data.stdNoOrName}%`),
      });

      if (!student) {
        throw new Error(`Student with name "${data.stdNoOrName}" not found`);
      }

      return await db
        .update(sponsoredStudents)
        .set({
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(sponsoredStudents.stdNo, student.stdNo))
        .returning();
    }
  }

  async bulkUpdateAccountDetails(
    items: Array<{
      stdNoOrName: string;
      bankName: string;
      accountNumber: string;
    }>,
    batchSize: number = 100
  ): Promise<
    Array<{
      success: boolean;
      data?: SponsoredStudent[];
      error?: string;
      item: {
        stdNoOrName: string;
        bankName: string;
        accountNumber: string;
      };
    }>
  > {
    const results: Array<{
      success: boolean;
      data?: SponsoredStudent[];
      error?: string;
      item: {
        stdNoOrName: string;
        bankName: string;
        accountNumber: string;
      };
    }> = [];

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }

  private async processBatch(
    batch: Array<{
      stdNoOrName: string;
      bankName: string;
      accountNumber: string;
    }>
  ): Promise<
    Array<{
      success: boolean;
      data?: SponsoredStudent[];
      error?: string;
      item: {
        stdNoOrName: string;
        bankName: string;
        accountNumber: string;
      };
    }>
  > {
    const results: Array<{
      success: boolean;
      data?: SponsoredStudent[];
      error?: string;
      item: {
        stdNoOrName: string;
        bankName: string;
        accountNumber: string;
      };
    }> = [];

    // Use a transaction for better performance with batch processing
    await db.transaction(async (tx) => {
      for (const item of batch) {
        try {
          const isNumeric = !isNaN(Number(item.stdNoOrName));

          if (isNumeric) {
            const stdNo = Number(item.stdNoOrName);
            const result = await tx
              .update(sponsoredStudents)
              .set({
                bankName: item.bankName,
                accountNumber: item.accountNumber,
                updatedAt: sql`(unixepoch())`,
              })
              .where(eq(sponsoredStudents.stdNo, stdNo))
              .returning();

            if (result.length > 0) {
              results.push({ success: true, data: result, item });
            } else {
              results.push({
                success: false,
                error: `No sponsored student found with student number: ${item.stdNoOrName}`,
                item,
              });
            }
          } else {
            const student = await tx.query.students.findFirst({
              where: like(students.name, `%${item.stdNoOrName}%`),
            });

            if (!student) {
              results.push({
                success: false,
                error: `Student with name "${item.stdNoOrName}" not found`,
                item,
              });
              continue;
            }

            const result = await tx
              .update(sponsoredStudents)
              .set({
                bankName: item.bankName,
                accountNumber: item.accountNumber,
                updatedAt: sql`(unixepoch())`,
              })
              .where(eq(sponsoredStudents.stdNo, student.stdNo))
              .returning();

            if (result.length > 0) {
              results.push({ success: true, data: result, item });
            } else {
              results.push({
                success: false,
                error: `No sponsored student found for: ${item.stdNoOrName}`,
                item,
              });
            }
          }
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            item,
          });
        }
      }
    });

    return results;
  }

  async confirmSponsoredStudent(stdNo: number, termId: number) {
    console.log(`Delete this and do something with ${termId}`);
    const result = await db
      .update(sponsoredStudents)
      .set({
        confirmed: true,
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(sponsoredStudents.stdNo, stdNo))
      .returning();

    return result[0];
  }
}

export const sponsorsRepository = new SponsorRepository();
