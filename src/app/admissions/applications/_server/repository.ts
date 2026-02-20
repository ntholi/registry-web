import { and, count, eq, exists, ilike, inArray, or } from 'drizzle-orm';
import {
	type ApplicationStatus,
	applicantPhones,
	applicants,
	applicationNotes,
	applicationStatusHistory,
	applications,
	db,
	type PaymentStatus,
	programs,
	users,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { ApplicationFilters } from '../_lib/types';

export default class ApplicationRepository extends BaseRepository<
	typeof applications,
	'id'
> {
	constructor() {
		super(applications, applications.id);
	}

	override async findById(id: string) {
		return db.query.applications.findFirst({
			where: eq(applications.id, id),
			with: {
				applicant: {
					columns: {
						id: true,
						fullName: true,
						nationalId: true,
						nationality: true,
					},
				},
				intakePeriod: {
					columns: {
						id: true,
						name: true,
						localApplicationFee: true,
						internationalApplicationFee: true,
						startDate: true,
						endDate: true,
					},
				},
				firstChoiceProgram: {
					columns: { id: true, name: true, code: true },
					with: { school: { columns: { shortName: true } } },
				},
				secondChoiceProgram: {
					columns: { id: true, name: true, code: true },
					with: { school: { columns: { shortName: true } } },
				},
				createdByUser: {
					columns: { id: true, name: true },
				},
				bankDeposits: {
					with: {
						receipt: {
							columns: { id: true, receiptNo: true, createdAt: true },
						},
					},
					orderBy: (bd, { desc }) => [desc(bd.createdAt)],
				},
				mobileDeposits: {
					with: {
						receipt: {
							columns: { id: true, receiptNo: true, createdAt: true },
						},
					},
					orderBy: (md, { desc }) => [desc(md.createdAt)],
				},
				statusHistory: {
					with: {
						changedByUser: { columns: { id: true, name: true } },
					},
					orderBy: (sh, { desc }) => [desc(sh.changedAt)],
				},
				notes: {
					with: {
						createdByUser: { columns: { id: true, name: true } },
					},
					orderBy: (n, { desc }) => [desc(n.createdAt)],
				},
			},
		});
	}

	async search(page: number, search: string, filters?: ApplicationFilters) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const conditions = [];

		if (filters?.status) {
			conditions.push(eq(applications.status, filters.status));
		}
		if (filters?.paymentStatus) {
			conditions.push(eq(applications.paymentStatus, filters.paymentStatus));
		}
		if (filters?.intakePeriodId) {
			conditions.push(eq(applications.intakePeriodId, filters.intakePeriodId));
		}

		if (search) {
			conditions.push(
				or(
					exists(
						db
							.select({ id: applicants.id })
							.from(applicants)
							.where(
								and(
									eq(applicants.id, applications.applicantId),
									or(
										ilike(applicants.fullName, `%${search}%`),
										ilike(applicants.nationalId, `%${search}%`)
									)
								)
							)
					),
					exists(
						db
							.select({ id: users.id })
							.from(users)
							.innerJoin(applicants, eq(applicants.userId, users.id))
							.where(
								and(
									eq(applicants.id, applications.applicantId),
									ilike(users.email, `%${search}%`)
								)
							)
					),
					exists(
						db
							.select({ id: applicantPhones.id })
							.from(applicantPhones)
							.innerJoin(
								applicants,
								eq(applicantPhones.applicantId, applicants.id)
							)
							.where(
								and(
									eq(applicants.id, applications.applicantId),
									ilike(applicantPhones.phoneNumber, `%${search}%`)
								)
							)
					),
					exists(
						db
							.select({ id: programs.id })
							.from(programs)
							.where(
								and(
									eq(programs.id, applications.firstChoiceProgramId),
									ilike(programs.name, `%${search}%`)
								)
							)
					)
				)!
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const [items, [{ total }]] = await Promise.all([
			db.query.applications.findMany({
				where,
				limit: pageSize,
				offset,
				orderBy: (a, { desc }) => [desc(a.applicationDate)],
				with: {
					applicant: {
						columns: {
							id: true,
							fullName: true,
							nationalId: true,
							nationality: true,
						},
					},
					intakePeriod: {
						columns: {
							id: true,
							name: true,
							localApplicationFee: true,
							internationalApplicationFee: true,
						},
					},
					firstChoiceProgram: {
						columns: { id: true, name: true, code: true },
					},
				},
			}),
			db
				.select({ total: count() })
				.from(applications)
				.where(where ?? undefined),
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async findByApplicant(applicantId: string) {
		return db.query.applications.findMany({
			where: eq(applications.applicantId, applicantId),
			with: {
				intakePeriod: {
					columns: { id: true, name: true },
				},
				firstChoiceProgram: {
					columns: { id: true, name: true, code: true },
					with: { school: { columns: { shortName: true } } },
				},
				secondChoiceProgram: {
					columns: { id: true, name: true, code: true },
					with: { school: { columns: { shortName: true } } },
				},
				bankDeposits: {
					columns: { id: true, status: true },
				},
				mobileDeposits: {
					columns: { id: true, status: true },
				},
			},
			orderBy: (a, { desc }) => [desc(a.applicationDate)],
		});
	}

	async countByStatus(status: ApplicationStatus) {
		const [result] = await db
			.select({ total: count() })
			.from(applications)
			.where(eq(applications.status, status));
		return result.total;
	}

	async countPending() {
		const [result] = await db
			.select({ total: count() })
			.from(applications)
			.where(inArray(applications.status, ['submitted', 'under_review']));
		return result.total;
	}

	async findByApplicantAndIntake(applicantId: string, intakePeriodId: string) {
		return db.query.applications.findFirst({
			where: and(
				eq(applications.applicantId, applicantId),
				eq(applications.intakePeriodId, intakePeriodId)
			),
		});
	}

	async existsForIntake(applicantId: string, intakePeriodId: string) {
		const existing = await this.findByApplicantAndIntake(
			applicantId,
			intakePeriodId
		);
		return !!existing;
	}

	async addStatusHistory(data: typeof applicationStatusHistory.$inferInsert) {
		const [entry] = await db
			.insert(applicationStatusHistory)
			.values(data)
			.returning();
		return entry;
	}

	async updateStatus(id: string, status: ApplicationStatus) {
		const [updated] = await db
			.update(applications)
			.set({ status, updatedAt: new Date() })
			.where(eq(applications.id, id))
			.returning();
		return updated;
	}

	async addNote(data: typeof applicationNotes.$inferInsert) {
		const [note] = await db.insert(applicationNotes).values(data).returning();
		return note;
	}

	async getNotes(applicationId: string) {
		return db.query.applicationNotes.findMany({
			where: eq(applicationNotes.applicationId, applicationId),
			with: {
				createdByUser: { columns: { id: true, name: true } },
			},
			orderBy: (n, { desc }) => [desc(n.createdAt)],
		});
	}

	async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
		const [updated] = await db
			.update(applications)
			.set({ paymentStatus, updatedAt: new Date() })
			.where(eq(applications.id, id))
			.returning();
		return updated;
	}

	async findForPayment(id: string) {
		return db.query.applications.findFirst({
			where: eq(applications.id, id),
			columns: {
				id: true,
				applicantId: true,
				paymentStatus: true,
			},
			with: {
				applicant: {
					columns: { nationality: true },
				},
				intakePeriod: {
					columns: {
						id: true,
						localApplicationFee: true,
						internationalApplicationFee: true,
						startDate: true,
						endDate: true,
					},
				},
			},
		});
	}
}
