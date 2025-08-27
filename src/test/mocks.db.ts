import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '../db/schema';
import * as relations from '../db/relations';

const testClient = createClient({
  url: ':memory:',
});

const testDb = drizzle(testClient, {
  schema: { ...schema, ...relations },
  casing: 'snake_case',
});

async function setupTestDatabase() {
  await migrate(testDb, { migrationsFolder: './drizzle' });
}

async function cleanupTestDatabase() {
  const tables = [
    schema.assessmentMarksAudit,
    schema.assessmentsAudit,
    schema.assessmentMarks,
    schema.assessments,
    schema.moduleGrades,
    schema.clearanceAudit,
    schema.clearance,
    schema.registrationClearance,
    schema.requestedModules,
    schema.registrationRequests,
    schema.sponsoredStudents,
    schema.assignedModules,
    schema.userSchools,
    schema.studentModules,
    schema.studentSemesters,
    schema.studentPrograms,
    schema.modulePrerequisites,
    schema.semesterModules,
    schema.structureSemesters,
    schema.structures,
    schema.programs,
    schema.schools,
    schema.modules,
    schema.students,
    schema.signups,
    schema.authenticators,
    schema.sessions,
    schema.accounts,
    schema.verificationTokens,
    schema.users,
    schema.terms,
    schema.sponsors,
  ];

  for (const table of tables) {
    try {
      await testDb.delete(table);
    } catch {
      // Ignore errors during cleanup
    }
  }
}

export { testDb, setupTestDatabase, cleanupTestDatabase };
