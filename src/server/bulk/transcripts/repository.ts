import { db } from '@/db';
import { studentPrograms } from '@/db/schema';
import { eq, and, sql, isNotNull } from 'drizzle-orm';

export default class BulkRepository {
  async findDistinctGraduationDates() {
    const result = await db
      .select({
        graduationDate: studentPrograms.graduationDate,
      })
      .from(studentPrograms)
      .where(
        and(
          eq(studentPrograms.status, 'Completed'),
          isNotNull(studentPrograms.graduationDate)
        )
      )
      .groupBy(studentPrograms.graduationDate)
      .orderBy(sql`${studentPrograms.graduationDate} DESC`);

    return result
      .map((row) => row.graduationDate)
      .filter((date): date is string => date !== null);
  }

  async findStudentsByGraduationDate(graduationDate: string) {
    const result = await db.query.studentPrograms.findMany({
      where: and(
        eq(studentPrograms.status, 'Completed'),
        eq(studentPrograms.graduationDate, graduationDate)
      ),
      with: {
        student: {
          columns: {
            stdNo: true,
          },
        },
      },
    });

    return result
      .map((program) => program.student?.stdNo)
      .filter((stdNo): stdNo is number => stdNo !== undefined);
  }
}
