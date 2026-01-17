import { semesterModules } from '@academic/semester-modules/_schema/semesterModules';
import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import { structures } from '@academic/structures/_schema/structures';
import { users } from '@auth/users/_schema/users';
import { blockedStudents } from '@registry/blocked-students/_schema/blockedStudents';
import { certificateReprints } from '@registry/certificate-reprints/_schema/certificateReprints';
import { documents } from '@registry/documents/_schema/documents';
import { graduationRequests } from '@registry/graduation-requests/_schema/graduationRequests';
import { statementOfResultsPrints } from '@registry/print/_schema/statementOfResultsPrints';
import { studentCardPrints } from '@registry/print/_schema/studentCardPrints';
import { transcriptPrints } from '@registry/print/_schema/transcriptPrints';
import { registrationRequests } from '@registry/registration-requests/_schema/registrationRequests';
import { relations } from 'drizzle-orm';
import { nextOfKins } from './nextOfKins';
import { studentEducation } from './studentEducation';
import { studentModules } from './studentModules';
import { studentPrograms } from './studentPrograms';
import { studentSemesters } from './studentSemesters';
import { students } from './students';

export const studentsRelations = relations(students, ({ many, one }) => ({
	user: one(users, {
		fields: [students.userId],
		references: [users.id],
	}),
	programs: many(studentPrograms),
	nextOfKins: many(nextOfKins),
	studentEducation: many(studentEducation),
	registrationRequests: many(registrationRequests),
	blockedStudents: many(blockedStudents),
	statementOfResultsPrints: many(statementOfResultsPrints),
	transcriptPrints: many(transcriptPrints),
	studentCardPrints: many(studentCardPrints),
	documents: many(documents),
	certificateReprints: many(certificateReprints),
}));

export const studentProgramsRelations = relations(
	studentPrograms,
	({ many, one }) => ({
		student: one(students, {
			fields: [studentPrograms.stdNo],
			references: [students.stdNo],
		}),
		structure: one(structures, {
			fields: [studentPrograms.structureId],
			references: [structures.id],
		}),
		semesters: many(studentSemesters),
		graduationRequest: one(graduationRequests, {
			fields: [studentPrograms.id],
			references: [graduationRequests.studentProgramId],
		}),
	})
);

export const studentSemestersRelations = relations(
	studentSemesters,
	({ many, one }) => ({
		studentProgram: one(studentPrograms, {
			fields: [studentSemesters.studentProgramId],
			references: [studentPrograms.id],
		}),
		structureSemester: one(structureSemesters, {
			fields: [studentSemesters.structureSemesterId],
			references: [structureSemesters.id],
		}),
		registrationRequest: one(registrationRequests, {
			fields: [studentSemesters.registrationRequestId],
			references: [registrationRequests.id],
		}),
		studentModules: many(studentModules),
	})
);

export const studentModulesRelations = relations(studentModules, ({ one }) => ({
	studentSemester: one(studentSemesters, {
		fields: [studentModules.studentSemesterId],
		references: [studentSemesters.id],
	}),
	semesterModule: one(semesterModules, {
		fields: [studentModules.semesterModuleId],
		references: [semesterModules.id],
	}),
}));

export const nextOfKinsRelations = relations(nextOfKins, ({ one }) => ({
	student: one(students, {
		fields: [nextOfKins.stdNo],
		references: [students.stdNo],
	}),
}));

export const studentEducationRelations = relations(
	studentEducation,
	({ one }) => ({
		student: one(students, {
			fields: [studentEducation.stdNo],
			references: [students.stdNo],
		}),
	})
);
