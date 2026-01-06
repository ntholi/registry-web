import type {
	assessmentMarks,
	assessments,
	modules,
	programs,
	schools,
	structures,
} from '@academic/_database';
import type { accounts, users } from '@auth/_database';
import type {
	nextOfKins,
	studentEducation,
	studentPrograms,
	students,
	terms,
} from '@registry/_database';

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;

export type Student = typeof students.$inferSelect;
export type StudentEducation = typeof studentEducation.$inferSelect;
export type NextOfKin = typeof nextOfKins.$inferSelect;
export type StudentProgram = typeof studentPrograms.$inferSelect;

export type School = typeof schools.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Structure = typeof structures.$inferSelect;
export type Term = typeof terms.$inferSelect;
export type Module = typeof modules.$inferSelect;

export type Assessment = typeof assessments.$inferSelect;
export type AssessmentMark = typeof assessmentMarks.$inferSelect;
