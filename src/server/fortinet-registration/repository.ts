import { db } from '@/db';
import {
  fortinetRegistrations,
  students,
  schools,
  fortinetLevelEnum,
} from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { and, desc, eq, like, or, SQL } from 'drizzle-orm';

type FortinetLevel = typeof fortinetLevelEnum.enumValues[number];

export default class FortinetRegistrationRepository extends BaseRepository<
  typeof fortinetRegistrations,
  'id'
> {
  constructor() {
    super(fortinetRegistrations, fortinetRegistrations.id);
  }

  async findByStudentNumber(stdNo: number) {
    return await db.query.fortinetRegistrations.findMany({
      where: eq(fortinetRegistrations.stdNo, stdNo),
      with: {
        student: {
          columns: {
            stdNo: true,
            name: true,
          },
        },
        school: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(fortinetRegistrations.createdAt)],
    });
  }

  async findByStudentAndLevel(stdNo: number, level: FortinetLevel) {
    return await db.query.fortinetRegistrations.findFirst({
      where: and(
        eq(fortinetRegistrations.stdNo, stdNo),
        eq(fortinetRegistrations.level, level)
      ),
      with: {
        student: {
          columns: {
            stdNo: true,
            name: true,
          },
        },
        school: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findForSchool(
    schoolId: number,
    options?: QueryOptions<typeof fortinetRegistrations>
  ) {
    const { orderBy, offset, limit, where } = this.buildQueryCriteria(
      options || {}
    );

    let customWhere: SQL | undefined = eq(
      fortinetRegistrations.schoolId,
      schoolId
    );
    if (where) {
      customWhere = and(customWhere, where);
    }

    if (options?.search) {
      const searchTerms = options.search
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map((term) => {
          const conditions = [];

          if (!isNaN(Number(term))) {
            conditions.push(eq(fortinetRegistrations.stdNo, Number(term)));
          }

          conditions.push(like(students.name, `%${term}%`));
          return or(...conditions);
        });

        const searchWhere = and(...searchConditions);
        customWhere = customWhere ? and(customWhere, searchWhere) : searchWhere;
      }
    }

    const items = await db
      .select({
        id: fortinetRegistrations.id,
        stdNo: fortinetRegistrations.stdNo,
        level: fortinetRegistrations.level,
        status: fortinetRegistrations.status,
        createdAt: fortinetRegistrations.createdAt,
        updatedAt: fortinetRegistrations.updatedAt,
        studentName: students.name,
        schoolName: schools.name,
      })
      .from(fortinetRegistrations)
      .innerJoin(students, eq(fortinetRegistrations.stdNo, students.stdNo))
      .innerJoin(schools, eq(fortinetRegistrations.schoolId, schools.id))
      .where(customWhere)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const totalItems = await db
      .select({ count: fortinetRegistrations.id })
      .from(fortinetRegistrations)
      .innerJoin(students, eq(fortinetRegistrations.stdNo, students.stdNo))
      .innerJoin(schools, eq(fortinetRegistrations.schoolId, schools.id))
      .where(customWhere)
      .then((results) => results.length);

    return {
      items,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    };
  }

  protected override buildQueryCriteria(
    options: QueryOptions<typeof fortinetRegistrations>
  ) {
    const criteria = super.buildQueryCriteria(options);
    if (!options.sort || options.sort.length === 0) {
      criteria.orderBy = [desc(fortinetRegistrations.createdAt)];
    }
    return criteria;
  }
}

export const fortinetRegistrationRepository =
  new FortinetRegistrationRepository();
