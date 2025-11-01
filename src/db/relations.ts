import { relations } from 'drizzle-orm';
import {
	accounts,
	assessmentMarks,
	assessmentMarksAudit,
	assessments,
	assessmentsAudit,
	assignedModules,
	authenticators,
	blockedStudents,
	clearance,
	clearanceAudit,
	documents,
	fortinetRegistrations,
	graduationClearance,
	graduationLists,
	graduationRequests,
	moduleGrades,
	modulePrerequisites,
	modules,
	paymentReceipts,
	programs,
	registrationClearance,
	registrationRequests,
	requestedModules,
	schools,
	semesterModules,
	sessions,
	signups,
	sponsoredStudents,
	sponsoredTerms,
	sponsors,
	statementOfResultsPrints,
	structureSemesters,
	structures,
	studentCardPrints,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
	taskAssignments,
	tasks,
	terms,
	transcriptPrints,
	userSchools,
	users,
} from './schema';

export const usersRelations = relations(users, ({ many, one }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	authenticators: many(authenticators),
	signup: one(signups, {
		fields: [users.id],
		references: [signups.userId],
	}),
	student: one(students, {
		fields: [users.id],
		references: [students.userId],
	}),
	userSchools: many(userSchools),
	assignedModules: many(assignedModules),
	createdTasks: many(tasks),
	taskAssignments: many(taskAssignments),
	graduationListsCreated: many(graduationLists),
	statementOfResultsPrinted: many(statementOfResultsPrints),
	transcriptsPrinted: many(transcriptPrints),
	studentCardsPrinted: many(studentCardPrints),
	clearanceResponses: many(clearance),
	clearanceAudits: many(clearanceAudit),
	assessmentMarksAudits: many(assessmentMarksAudit),
	assessmentsAudits: many(assessmentsAudit),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
	user: one(users, {
		fields: [authenticators.userId],
		references: [users.id],
	}),
}));

export const signupsRelations = relations(signups, ({ one }) => ({
	user: one(users, {
		fields: [signups.userId],
		references: [users.id],
	}),
}));

export const studentsRelations = relations(students, ({ many, one }) => ({
	user: one(users, {
		fields: [students.userId],
		references: [users.id],
	}),
	programs: many(studentPrograms),
	registrationRequests: many(registrationRequests),
	graduationRequests: many(graduationRequests),
	sponsorships: many(sponsoredStudents),
	fortinetRegistrations: many(fortinetRegistrations),
	moduleGrades: many(moduleGrades),
	assessmentMarks: many(assessmentMarks),
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

export const schoolsRelations = relations(schools, ({ many }) => ({
	programs: many(programs),
	userSchools: many(userSchools),
	fortinetRegistrations: many(fortinetRegistrations),
}));

export const programsRelations = relations(programs, ({ many, one }) => ({
	school: one(schools, {
		fields: [programs.schoolId],
		references: [schools.id],
	}),
	structures: many(structures),
}));

export const structuresRelations = relations(structures, ({ many, one }) => ({
	program: one(programs, {
		fields: [structures.programId],
		references: [programs.id],
	}),
	semesters: many(structureSemesters),
	students: many(students),
	studentPrograms: many(studentPrograms),
}));

export const structureSemestersRelations = relations(
	structureSemesters,
	({ many, one }) => ({
		structure: one(structures, {
			fields: [structureSemesters.structureId],
			references: [structures.id],
		}),
		semesterModules: many(semesterModules),
	})
);

export const semesterModulesRelations = relations(
	semesterModules,
	({ many, one }) => ({
		prerequisites: many(modulePrerequisites, {
			relationName: 'semesterModulePrerequisites',
		}),
		prerequisiteFor: many(modulePrerequisites, {
			relationName: 'prerequisiteModules',
		}),
		requestedModules: many(requestedModules),
		semester: one(structureSemesters, {
			fields: [semesterModules.semesterId],
			references: [structureSemesters.id],
		}),
		studentModules: many(studentModules),
		module: one(modules, {
			fields: [semesterModules.moduleId],
			references: [modules.id],
		}),
		assignedModules: many(assignedModules),
	})
);

export const moduleGradesRelations = relations(moduleGrades, ({ one }) => ({
	module: one(modules, {
		fields: [moduleGrades.moduleId],
		references: [modules.id],
	}),
	student: one(students, {
		fields: [moduleGrades.stdNo],
		references: [students.stdNo],
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

export const graduationListsRelations = relations(
	graduationLists,
	({ one }) => ({
		createdByUser: one(users, {
			fields: [graduationLists.createdBy],
			references: [users.id],
		}),
	})
);

export const modulesRelations = relations(modules, ({ many }) => ({
	semesterModules: many(semesterModules),
	assessments: many(assessments),
	moduleGrades: many(moduleGrades),
}));

export const modulePrerequisitesRelations = relations(
	modulePrerequisites,
	({ one }) => ({
		semesterModule: one(semesterModules, {
			fields: [modulePrerequisites.semesterModuleId],
			references: [semesterModules.id],
			relationName: 'semesterModulePrerequisites',
		}),
		prerequisite: one(semesterModules, {
			fields: [modulePrerequisites.prerequisiteId],
			references: [semesterModules.id],
			relationName: 'prerequisiteModules',
		}),
	})
);

export const termsRelations = relations(terms, ({ many }) => ({
	registrationRequests: many(registrationRequests),
	sponsoredTerms: many(sponsoredTerms),
	assignedModules: many(assignedModules),
	assessments: many(assessments),
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
		sponsor: one(sponsors, {
			fields: [registrationRequests.sponsorId],
			references: [sponsors.id],
		}),
		clearances: many(registrationClearance),
		requestedModules: many(requestedModules),
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
		paymentReceipts: many(paymentReceipts),
		graduationClearances: many(graduationClearance),
	})
);

export const paymentReceiptsRelations = relations(
	paymentReceipts,
	({ one }) => ({
		graduationRequest: one(graduationRequests, {
			fields: [paymentReceipts.graduationRequestId],
			references: [graduationRequests.id],
		}),
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

export const sponsorsRelations = relations(sponsors, ({ many }) => ({
	registrationRequests: many(registrationRequests),
	sponsoredStudents: many(sponsoredStudents),
}));

export const sponsoredStudentsRelations = relations(
	sponsoredStudents,
	({ one, many }) => ({
		sponsor: one(sponsors, {
			fields: [sponsoredStudents.sponsorId],
			references: [sponsors.id],
		}),
		student: one(students, {
			fields: [sponsoredStudents.stdNo],
			references: [students.stdNo],
		}),
		sponsoredTerms: many(sponsoredTerms),
	})
);

export const sponsoredTermsRelations = relations(sponsoredTerms, ({ one }) => ({
	sponsoredStudent: one(sponsoredStudents, {
		fields: [sponsoredTerms.sponsoredStudentId],
		references: [sponsoredStudents.id],
	}),
	term: one(terms, {
		fields: [sponsoredTerms.termId],
		references: [terms.id],
	}),
}));

export const assignedModulesRelations = relations(
	assignedModules,
	({ one }) => ({
		user: one(users, {
			fields: [assignedModules.userId],
			references: [users.id],
		}),
		semesterModule: one(semesterModules, {
			fields: [assignedModules.semesterModuleId],
			references: [semesterModules.id],
		}),
		term: one(terms, {
			fields: [assignedModules.termId],
			references: [terms.id],
		}),
	})
);

export const assessmentsRelations = relations(assessments, ({ many, one }) => ({
	module: one(modules, {
		fields: [assessments.moduleId],
		references: [modules.id],
	}),
	term: one(terms, {
		fields: [assessments.termId],
		references: [terms.id],
	}),
	marks: many(assessmentMarks),
	audits: many(assessmentsAudit),
}));

export const assessmentMarksRelations = relations(
	assessmentMarks,
	({ one, many }) => ({
		assessment: one(assessments, {
			fields: [assessmentMarks.assessmentId],
			references: [assessments.id],
		}),
		student: one(students, {
			fields: [assessmentMarks.stdNo],
			references: [students.stdNo],
		}),
		audits: many(assessmentMarksAudit),
	})
);

export const assessmentMarksAuditRelations = relations(
	assessmentMarksAudit,
	({ one }) => ({
		assessmentMark: one(assessmentMarks, {
			fields: [assessmentMarksAudit.assessmentMarkId],
			references: [assessmentMarks.id],
		}),
		createdByUser: one(users, {
			fields: [assessmentMarksAudit.createdBy],
			references: [users.id],
		}),
	})
);

export const assessmentsAuditRelations = relations(
	assessmentsAudit,
	({ one }) => ({
		assessment: one(assessments, {
			fields: [assessmentsAudit.assessmentId],
			references: [assessments.id],
		}),
		createdByUser: one(users, {
			fields: [assessmentsAudit.createdBy],
			references: [users.id],
		}),
	})
);

export const userSchoolsRelations = relations(userSchools, ({ one }) => ({
	user: one(users, {
		fields: [userSchools.userId],
		references: [users.id],
	}),
	school: one(schools, {
		fields: [userSchools.schoolId],
		references: [schools.id],
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

export const fortinetRegistrationsRelations = relations(
	fortinetRegistrations,
	({ one }) => ({
		student: one(students, {
			fields: [fortinetRegistrations.stdNo],
			references: [students.stdNo],
		}),
		school: one(schools, {
			fields: [fortinetRegistrations.schoolId],
			references: [schools.id],
		}),
	})
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [tasks.createdBy],
		references: [users.id],
	}),
	taskAssignments: many(taskAssignments),
}));

export const taskAssignmentsRelations = relations(
	taskAssignments,
	({ one }) => ({
		task: one(tasks, {
			fields: [taskAssignments.taskId],
			references: [tasks.id],
		}),
		user: one(users, {
			fields: [taskAssignments.userId],
			references: [users.id],
		}),
	})
);
