import type { recognizedSchools } from '@admissions/_database';

export type RecognizedSchool = typeof recognizedSchools.$inferSelect;
export type RecognizedSchoolInsert = typeof recognizedSchools.$inferInsert;
