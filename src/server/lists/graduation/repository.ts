import { db } from '@/db';
import {
  graduationLists,
  graduationRequests,
  programs,
  schools,
  structures,
  studentPrograms,
  students,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, eq, sql } from 'drizzle-orm';

export default class GraduationListRepository extends BaseRepository<
  typeof graduationLists,
  'id'
> {
  constructor() {
    super(graduationLists, 'id');
  }

  async getStudentsForGraduation() {
    // Get all graduation requests where all three departments (finance, library, academic) have approved clearance
    const studentsWithClearance = await db
      .select({
        graduationRequestId: graduationRequests.id,
        studentNo: students.stdNo,
        studentName: students.name,
        programName: programs.name,
        schoolName: schools.name,
        graduationGownReceipt: sql<string>`
          COALESCE((
            SELECT receipt_no 
            FROM payment_receipts 
            WHERE graduation_request_id = ${graduationRequests.id} 
            AND payment_type = 'graduation_gown'
            LIMIT 1
          ), '')
        `,
        graduationFeeReceipt: sql<string>`
          COALESCE((
            SELECT receipt_no 
            FROM payment_receipts 
            WHERE graduation_request_id = ${graduationRequests.id} 
            AND payment_type = 'graduation_fee'
            LIMIT 1
          ), '')
        `,
      })
      .from(graduationRequests)
      .innerJoin(
        studentPrograms,
        eq(graduationRequests.studentProgramId, studentPrograms.id)
      )
      .innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
      .innerJoin(structures, eq(studentPrograms.structureId, structures.id))
      .innerJoin(programs, eq(structures.programId, programs.id))
      .innerJoin(schools, eq(programs.schoolId, schools.id))
      .where(
        and(
          // No rejected clearances
          sql`NOT EXISTS (
            SELECT 1 FROM clearance c 
            INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
            WHERE gc.graduation_request_id = ${graduationRequests.id} 
            AND c.status = 'rejected'
          )`,
          // No pending clearances
          sql`NOT EXISTS (
            SELECT 1 FROM clearance c 
            INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
            WHERE gc.graduation_request_id = ${graduationRequests.id} 
            AND c.status = 'pending'
          )`,
          // Has clearances (all should be approved)
          sql`EXISTS (
            SELECT 1 FROM graduation_clearance gc 
            WHERE gc.graduation_request_id = ${graduationRequests.id}
          )`,
          // Must have all three departments approved
          sql`(
            SELECT COUNT(DISTINCT c.department) 
            FROM clearance c 
            INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
            WHERE gc.graduation_request_id = ${graduationRequests.id} 
            AND c.status = 'approved'
          ) = 3`
        )
      );

    return studentsWithClearance;
  }
}

export const graduationListsRepository = new GraduationListRepository();
