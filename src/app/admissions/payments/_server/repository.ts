import {
	and,
	count,
	desc,
	eq,
	exists,
	ilike,
	isNull,
	or,
	type SQL,
	sql,
} from 'drizzle-orm';
import {
	admissionReceipts,
	applicantPhones,
	applicants,
	applications,
	bankDeposits,
	type DepositStatus,
	db,
	documents,
	mobileDeposits,
	users,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { DepositFilters } from '../_lib/types';

const LOCK_EXPIRY_MS = 5 * 60 * 1000;

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
			where: eq(documents.id, deposit.documentId),
		});

		return { ...deposit, document };
	}

	async searchBankDeposits(
		page: number,
		search: string,
		filters?: DepositFilters,
		currentUserId?: string
	) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;
		const conditions: SQL[] = [];

		const notLockedByOthers = or(
			isNull(bankDeposits.reviewLockedBy),
			currentUserId
				? eq(bankDeposits.reviewLockedBy, currentUserId)
				: sql`false`,
			sql`${bankDeposits.reviewLockedAt} < NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'`
		)!;
		conditions.push(notLockedByOthers);

		if (filters?.status) {
			conditions.push(eq(bankDeposits.status, filters.status));
		}

		if (search) {
			conditions.push(
				or(
					ilike(bankDeposits.reference, `%${search}%`),
					ilike(bankDeposits.depositorName, `%${search}%`),
					ilike(applicants.fullName, `%${search}%`),
					ilike(applicants.nationalId, `%${search}%`),
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
				)!
			);
		}

		const where =
			conditions.length > 0
				? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
				: undefined;

		const baseQuery = db
			.select({
				id: bankDeposits.id,
				status: bankDeposits.status,
				type: bankDeposits.type,
				reference: bankDeposits.reference,
				amountDeposited: bankDeposits.amountDeposited,
				applicationId: applications.id,
				applicantId: applicants.id,
				applicantName: applicants.fullName,
				createdAt: bankDeposits.createdAt,
			})
			.from(bankDeposits)
			.leftJoin(applications, eq(applications.id, bankDeposits.applicationId))
			.leftJoin(applicants, eq(applicants.id, applications.applicantId));

		const countQuery = db
			.select({ total: count() })
			.from(bankDeposits)
			.leftJoin(applications, eq(applications.id, bankDeposits.applicationId))
			.leftJoin(applicants, eq(applicants.id, applications.applicantId));

		const [items, [{ total }]] = await Promise.all([
			where
				? baseQuery
						.where(where)
						.orderBy(desc(bankDeposits.createdAt))
						.limit(pageSize)
						.offset(offset)
				: baseQuery
						.orderBy(desc(bankDeposits.createdAt))
						.limit(pageSize)
						.offset(offset),
			where ? countQuery.where(where) : countQuery,
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async acquireLock(depositId: string, userId: string) {
		const [deposit] = await db
			.update(bankDeposits)
			.set({
				reviewLockedBy: userId,
				reviewLockedAt: new Date(),
			})
			.where(
				and(
					eq(bankDeposits.id, depositId),
					or(
						isNull(bankDeposits.reviewLockedBy),
						eq(bankDeposits.reviewLockedBy, userId),
						sql`${bankDeposits.reviewLockedAt} < NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'`
					)
				)
			)
			.returning();

		return deposit ?? null;
	}

	async releaseLock(depositId: string, userId: string) {
		const [deposit] = await db
			.update(bankDeposits)
			.set({
				reviewLockedBy: null,
				reviewLockedAt: null,
			})
			.where(
				and(
					eq(bankDeposits.id, depositId),
					eq(bankDeposits.reviewLockedBy, userId)
				)
			)
			.returning();

		return deposit ?? null;
	}

	async releaseAllLocks(userId: string) {
		await db
			.update(bankDeposits)
			.set({
				reviewLockedBy: null,
				reviewLockedAt: null,
			})
			.where(eq(bankDeposits.reviewLockedBy, userId));
	}

	async findNextUnlocked(
		currentId: string,
		userId: string,
		filters?: {
			status?: DepositStatus;
		}
	) {
		const conditions: SQL[] = [
			sql`${bankDeposits.id} != ${currentId}`,
			or(
				isNull(bankDeposits.reviewLockedBy),
				eq(bankDeposits.reviewLockedBy, userId),
				sql`${bankDeposits.reviewLockedAt} < NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'`
			)!,
		];

		if (filters?.status) {
			conditions.push(eq(bankDeposits.status, filters.status));
		}

		const where = conditions.reduce((a, b) => sql`${a} AND ${b}`);

		const [next] = await db
			.select({ id: bankDeposits.id })
			.from(bankDeposits)
			.where(where)
			.orderBy(desc(bankDeposits.createdAt))
			.limit(1);

		return next ?? null;
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

	async updateBankDepositStatus(
		id: string,
		status: DepositStatus,
		rejectionReason?: string
	) {
		const [updated] = await db
			.update(bankDeposits)
			.set({
				status,
				rejectionReason: status === 'rejected' ? rejectionReason : null,
			})
			.where(eq(bankDeposits.id, id))
			.returning();
		return updated;
	}

	async linkReceiptToBankDeposit(depositId: string, receiptId: string) {
		const [updated] = await db
			.update(bankDeposits)
			.set({ receiptId, status: 'verified', rejectionReason: null })
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
