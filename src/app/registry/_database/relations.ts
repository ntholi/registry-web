import {
	assessments,
	assignedModules,
	semesterModules,
	structureSemesters,
	structures,
} from '@academic/_database';
import { users } from '@auth/_database';
import { paymentReceipts, sponsoredStudents } from '@finance/_database';
import { relations } from 'drizzle-orm';
import { blockedStudents, documents } from './schema/documents';
import {
	graduationClearance,
	graduationRequestReceipts,
	graduationRequests,
} from './schema/graduation';
import { graduationDates } from './schema/graduations';
import {
	statementOfResultsPrints,
	studentCardPrints,
	transcriptPrints,
} from './schema/printing';
import {
	clearance,
	clearanceAudit,
	registrationClearance,
	registrationRequests,
	requestedModules,
} from './schema/registration';
import {
	nextOfKins,
	studentEducation,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
} from './schema/students';
import { terms } from './schema/terms';

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

export const termsRelations = relations(terms, ({ many }) => ({
	assignedModules: many(assignedModules),
	assessments: many(assessments),
	registrationRequests: many(registrationRequests),
	graduations: many(graduationDates),
}));

export const graduationRelations = relations(graduationDates, ({ one }) => ({
	term: one(terms, {
		fields: [graduationDates.termId],
		references: [terms.id],
	}),
}));

export const registrationRequestsRelations = relations(
	registrationRequests,
	({ many, one }) => ({
		student: one(students, {
			fields: [registrationRequests.stdNo],
			references: [students.stdNo],
		}),
		term: one(terms, {
			fields: [registrationRequests.termId],
			references: [terms.id],
		}),
		sponsoredStudent: one(sponsoredStudents, {
			fields: [registrationRequests.sponsoredStudentId],
			references: [sponsoredStudents.id],
		}),
		clearances: many(registrationClearance),
		requestedModules: many(requestedModules),
		studentSemester: one(studentSemesters, {
			fields: [registrationRequests.id],
			references: [studentSemesters.registrationRequestId],
		}),
	})
);

export const requestedModulesRelations = relations(
	requestedModules,
	({ one }) => ({
		registrationRequest: one(registrationRequests, {
			fields: [requestedModules.registrationRequestId],
			references: [registrationRequests.id],
		}),
		semesterModule: one(semesterModules, {
			fields: [requestedModules.semesterModuleId],
			references: [semesterModules.id],
		}),
	})
);

export const clearanceRelations = relations(clearance, ({ one, many }) => ({
	respondedBy: one(users, {
		fields: [clearance.respondedBy],
		references: [users.id],
	}),
	audits: many(clearanceAudit),
	registrationClearances: many(registrationClearance),
	graduationClearances: many(graduationClearance),
}));

export const registrationClearanceRelations = relations(
	registrationClearance,
	({ one }) => ({
		registrationRequest: one(registrationRequests, {
			fields: [registrationClearance.registrationRequestId],
			references: [registrationRequests.id],
		}),
		clearance: one(clearance, {
			fields: [registrationClearance.clearanceId],
			references: [clearance.id],
		}),
	})
);

export const graduationClearanceRelations = relations(
	graduationClearance,
	({ one }) => ({
		graduationRequest: one(graduationRequests, {
			fields: [graduationClearance.graduationRequestId],
			references: [graduationRequests.id],
		}),
		clearance: one(clearance, {
			fields: [graduationClearance.clearanceId],
			references: [clearance.id],
		}),
	})
);

export const graduationRequestsRelations = relations(
	graduationRequests,
	({ one, many }) => ({
		studentProgram: one(studentPrograms, {
			fields: [graduationRequests.studentProgramId],
			references: [studentPrograms.id],
		}),
		graduationRequestReceipts: many(graduationRequestReceipts),
		graduationClearances: many(graduationClearance),
	})
);

export const graduationRequestReceiptsRelations = relations(
	graduationRequestReceipts,
	({ one }) => ({
		graduationRequest: one(graduationRequests, {
			fields: [graduationRequestReceipts.graduationRequestId],
			references: [graduationRequests.id],
		}),
		receipt: one(paymentReceipts, {
			fields: [graduationRequestReceipts.receiptId],
			references: [paymentReceipts.id],
		}),
	})
);

export const paymentReceiptsRelations = relations(
	paymentReceipts,
	({ one, many }) => ({
		student: one(students, {
			fields: [paymentReceipts.stdNo],
			references: [students.stdNo],
		}),
		createdByUser: one(users, {
			fields: [paymentReceipts.createdBy],
			references: [users.id],
		}),
		graduationRequestReceipts: many(graduationRequestReceipts),
		studentCardPrints: many(studentCardPrints),
	})
);

export const clearanceAuditRelations = relations(clearanceAudit, ({ one }) => ({
	clearance: one(clearance, {
		fields: [clearanceAudit.clearanceId],
		references: [clearance.id],
	}),
	user: one(users, {
		fields: [clearanceAudit.createdBy],
		references: [users.id],
	}),
}));

export const statementOfResultsPrintsRelations = relations(
	statementOfResultsPrints,
	({ one }) => ({
		student: one(students, {
			fields: [statementOfResultsPrints.stdNo],
			references: [students.stdNo],
		}),
		printedByUser: one(users, {
			fields: [statementOfResultsPrints.printedBy],
			references: [users.id],
		}),
	})
);

export const transcriptPrintsRelations = relations(
	transcriptPrints,
	({ one }) => ({
		student: one(students, {
			fields: [transcriptPrints.stdNo],
			references: [students.stdNo],
		}),
		printedByUser: one(users, {
			fields: [transcriptPrints.printedBy],
			references: [users.id],
		}),
	})
);

export const studentCardPrintsRelations = relations(
	studentCardPrints,
	({ one }) => ({
		receipt: one(paymentReceipts, {
			fields: [studentCardPrints.receiptId],
			references: [paymentReceipts.id],
		}),
		student: one(students, {
			fields: [studentCardPrints.stdNo],
			references: [students.stdNo],
		}),
		printedByUser: one(users, {
			fields: [studentCardPrints.printedBy],
			references: [users.id],
		}),
	})
);

export const documentsRelations = relations(documents, ({ one }) => ({
	student: one(students, {
		fields: [documents.stdNo],
		references: [students.stdNo],
	}),
}));

export const blockedStudentsRelations = relations(
	blockedStudents,
	({ one }) => ({
		student: one(students, {
			fields: [blockedStudents.stdNo],
			references: [students.stdNo],
		}),
	})
);
