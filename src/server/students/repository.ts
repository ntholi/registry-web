import BaseRepository from '@/server/base/BaseRepository';
import { students } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

export default class StudentRepository extends BaseRepository<
  typeof students,
  'stdNo'
> {
  constructor() {
    super(students, 'stdNo');
  }

  override async findById(stdNo: number) {
    return await db.query.students.findFirst({
      where: eq(students.stdNo, stdNo),
      with: {
        programs: {
          with: {
            semesters: {
              with: {
                modules: true,
              },
            },
          },
        },
      },
    });
  }
}

export const studentsRepository = new StudentRepository();
