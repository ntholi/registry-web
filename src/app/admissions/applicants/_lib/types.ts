import type {
	academicRecords,
	applicantDocuments,
	applicantPhones,
	applicants,
	guardianPhones,
	guardians,
	subjectGrades,
} from '@/core/database';

export type Applicant = typeof applicants.$inferSelect;
export type ApplicantInsert = typeof applicants.$inferInsert;

export type ApplicantPhone = typeof applicantPhones.$inferSelect;
export type ApplicantPhoneInsert = typeof applicantPhones.$inferInsert;

export type Guardian = typeof guardians.$inferSelect;
export type GuardianInsert = typeof guardians.$inferInsert;

export type GuardianPhone = typeof guardianPhones.$inferSelect;
export type GuardianPhoneInsert = typeof guardianPhones.$inferInsert;

export type ApplicantWithRelations = Applicant & {
	phones: ApplicantPhone[];
	guardians: (Guardian & { phones: GuardianPhone[] })[];
	academicRecords: (typeof academicRecords.$inferSelect & {
		certificateType: { id: number; name: string; lqfLevel: number };
		subjectGrades: (typeof subjectGrades.$inferSelect & {
			subject: { id: number; name: string };
		})[];
	})[];
	documents: (typeof applicantDocuments.$inferSelect)[];
};
