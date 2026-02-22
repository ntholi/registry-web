import { and, desc, eq, exists, ilike, or, sql } from 'drizzle-orm';
import {
	admissionReceipts,
	applicantPhones,
	applicants,
	applications,
	bankDeposits,
	type DepositStatus,
	db,
	mobileDeposits,
	users,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { DepositFilters } from '../_lib/types';

export default class PaymentRepository extends BaseRepository<
	typeof bankDeposits,
	'id'
> {
	constructor() {
		super(bankDeposits, bankDeposits.id);
	}

	async findBankDepositById(id: string) {
		return db.query.bankDeposits.findFirst({
			where: eq(bankDeposits.id, id),
			with: {
				application: {
					columns: { id: true },
					with: {
						applicant: {
							columns: { id: true, fullName: true },
						},
					},
				},
				receipt: true,
			},
		});
	}

	async findBankDepositWithDocument(id: string) {
		const deposit = await db.query.bankDeposits.findFirst({
			where: eq(bankDeposits.id, id),
			with: {
				application: {
					columns: { id: true, status: true, paymentStatus: true },
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
					},
				},
				receipt: {
					with: {
						createdByUser: { columns: { id: true, name: true } },
					},
				},
			},
		});

		if (!deposit) return null;

		const document = await db.query.documents.findFirst({
			where: eq(sql`id`, sql`${deposit.documentId}`),
		});

		return { ...deposit, document };
	}

	async searchBankDeposits(
		page: number,
		search: string,
		filters?: DepositFilters
	) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;
		const conditions: (ReturnType<typeof eq> | ReturnType<typeof or>)[] = [];

		if (filters?.status) {
			conditions.push(eq(bankDeposits.status, filters.status));
		}

		if (search) {
			conditions.push(
				or(
					ilike(bankDeposits.reference, `%${search}%`),
					ilike(bankDeposits.depositorName, `%${search}%`),
					exists(
						db
							.select({ id: applicants.id })
							.from(applicants)
							.innerJoin(
								applications,
								eq(applications.applicantId, applicants.id)
							)
							.where(
								and(
									eq(applications.id, bankDeposits.applicationId),
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
							.innerJoin(
								applications,
								eq(applications.applicantId, applicants.id)
							)
							.where(
								and(
									eq(applications.id, bankDeposits.applicationId),
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
							.innerJoin(
								applications,
								eq(applications.applicantId, applicants.id)
							)
							.where(
								and(
									eq(applications.id, bankDeposits.applicationId),
									ilike(applicantPhones.phoneNumber, `%${search}%`)
								)
							)
					)
				)
			);
		}

		const whereConditions =
			conditions.length > 0 ? and(...conditions) : undefined;

		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(bankDeposits)
			.where(whereConditions);

		const totalItems = Number(countResult[0]?.count || 0);
		const totalPages = Math.ceil(totalItems / pageSize);

		const depositIds = await db
			.select({ id: bankDeposits.id })
			.from(bankDeposits)
			.where(whereConditions)
			.orderBy(desc(bankDeposits.createdAt))
			.limit(pageSize)
			.offset(offset);

		const items = await Promise.all(
			depositIds.map((d) => this.findBankDepositById(d.id))
		);

		return {
			items: items.filter(
				(item): item is NonNullable<typeof item> => item !== null
			),
			totalPages,
			totalItems,
		};
	}

	async findBankDepositsByApplication(applicationId: string) {
		return db.query.bankDeposits.findMany({
			where: eq(bankDeposits.applicationId, applicationId),
			orderBy: desc(bankDeposits.createdAt),
			with: { receipt: true },
		});
	}

	async createBankDeposit(data: typeof bankDeposits.$inferInsert) {
		const [deposit] = await db.insert(bankDeposits).values(data).returning();
		return deposit;
	}

	async updateBankDepositStatus(id: string, status: DepositStatus) {
		const [updated] = await db
			.update(bankDeposits)
			.set({ status })
			.where(eq(bankDeposits.id, id))
			.returning();
		return updated;
	}

	async linkReceiptToBankDeposit(depositId: string, receiptId: string) {
		const [updated] = await db
			.update(bankDeposits)
			.set({ receiptId, status: 'verified' })
			.where(eq(bankDeposits.id, depositId))
			.returning();
		return updated;
	}

	async createReceipt(data: typeof admissionReceipts.$inferInsert) {
		const [receipt] = await db
			.insert(admissionReceipts)
			.values(data)
			.returning();
		return receipt;
	}

	async findReceiptByNo(receiptNo: string) {
		return db.query.admissionReceipts.findFirst({
			where: eq(admissionReceipts.receiptNo, receiptNo),
		});
	}

	async countBankDepositsByStatus(status: DepositStatus) {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(bankDeposits)
			.where(eq(bankDeposits.status, status));
		return Number(result[0]?.count || 0);
	}

	async updateApplicationPaymentStatus(
		applicationId: string,
		paymentStatus: 'paid' | 'unpaid'
	) {
		const [updated] = await db
			.update(applications)
			.set({ paymentStatus, updatedAt: new Date() })
			.where(eq(applications.id, applicationId))
			.returning();
		return updated;
	}

	async updateApplicationStatus(applicationId: string, status: 'rejected') {
		const [updated] = await db
			.update(applications)
			.set({ status, updatedAt: new Date() })
			.where(eq(applications.id, applicationId))
			.returning();
		return updated;
	}

	async createMobileDeposit(data: typeof mobileDeposits.$inferInsert) {
		const [deposit] = await db.insert(mobileDeposits).values(data).returning();
		return deposit;
	}

	async findMobileDepositById(id: string) {
		return db.query.mobileDeposits.findFirst({
			where: eq(mobileDeposits.id, id),
			with: {
				application: {
					columns: { id: true },
					with: {
						applicant: { columns: { id: true, fullName: true } },
					},
				},
				receipt: true,
			},
		});
	}

	async findMobileDepositByClientRef(clientReference: string) {
		return db.query.mobileDeposits.findFirst({
			where: eq(mobileDeposits.clientReference, clientReference),
		});
	}

	async findPendingMobileDeposit(applicationId: string) {
		return db.query.mobileDeposits.findFirst({
			where: and(
				eq(mobileDeposits.applicationId, applicationId),
				eq(mobileDeposits.status, 'pending')
			),
		});
	}

	async findMobileDepositsByApplication(applicationId: string) {
		return db.query.mobileDeposits.findMany({
			where: eq(mobileDeposits.applicationId, applicationId),
			orderBy: desc(mobileDeposits.createdAt),
			with: { receipt: true },
		});
	}

	async updateMobileDepositStatus(
		id: string,
		status: DepositStatus,
		providerReference?: string,
		providerResponse?: Record<string, unknown>
	) {
		const updateData: Partial<typeof mobileDeposits.$inferInsert> = {
			status,
		};
		if (providerReference) updateData.providerReference = providerReference;
		if (providerResponse)
			updateData.providerResponse =
				providerResponse as typeof updateData.providerResponse;

		const [updated] = await db
			.update(mobileDeposits)
			.set(updateData)
			.where(eq(mobileDeposits.id, id))
			.returning();
		return updated;
	}
}
