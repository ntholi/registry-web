import {
	and,
	asc,
	desc,
	eq,
	exists,
	ilike,
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
	intakePeriods,
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
		const rows = await db
			.select({
				applicationId: applications.id,
				applicationStatus: applications.status,
				applicationPaymentStatus: applications.paymentStatus,
				applicantId: applicants.id,
				applicantName: applicants.fullName,
				applicantNationalId: applicants.nationalId,
				applicantNationality: applicants.nationality,
				intakePeriodId: intakePeriods.id,
				intakePeriodName: intakePeriods.name,
				intakePeriodLocalApplicationFee: intakePeriods.localApplicationFee,
				intakePeriodInternationalApplicationFee:
					intakePeriods.internationalApplicationFee,
				depositId: bankDeposits.id,
				depositApplicationId: bankDeposits.applicationId,
				documentId: bankDeposits.documentId,
				receiptId: bankDeposits.receiptId,
				type: bankDeposits.type,
				status: bankDeposits.status,
				reference: bankDeposits.reference,
				receiptNumber: bankDeposits.receiptNumber,
				rejectionReason: bankDeposits.rejectionReason,
				beneficiaryName: bankDeposits.beneficiaryName,
				dateDeposited: bankDeposits.dateDeposited,
				amountDeposited: bankDeposits.amountDeposited,
				currency: bankDeposits.currency,
				depositorName: bankDeposits.depositorName,
				bankName: bankDeposits.bankName,
				paymentMode: bankDeposits.paymentMode,
				transactionNumber: bankDeposits.transactionNumber,
				terminalNumber: bankDeposits.terminalNumber,
				reviewLockedBy: bankDeposits.reviewLockedBy,
				reviewLockedAt: bankDeposits.reviewLockedAt,
				createdAt: bankDeposits.createdAt,
				documentFileName: documents.fileName,
				documentFileUrl: documents.fileUrl,
				documentType: documents.type,
				documentCreatedAt: documents.createdAt,
				receiptNo: admissionReceipts.receiptNo,
				receiptCreatedBy: admissionReceipts.createdBy,
				receiptCreatedAt: admissionReceipts.createdAt,
				receiptCreatedByUserId: users.id,
				receiptCreatedByUserName: users.name,
			})
			.from(bankDeposits)
			.innerJoin(applications, eq(applications.id, bankDeposits.applicationId))
			.innerJoin(applicants, eq(applicants.id, applications.applicantId))
			.leftJoin(
				intakePeriods,
				eq(intakePeriods.id, applications.intakePeriodId)
			)
			.leftJoin(documents, eq(documents.id, bankDeposits.documentId))
			.leftJoin(
				admissionReceipts,
				eq(admissionReceipts.id, bankDeposits.receiptId)
			)
			.leftJoin(users, eq(users.id, admissionReceipts.createdBy))
			.where(
				eq(
					bankDeposits.applicationId,
					sql`(SELECT application_id FROM bank_deposits WHERE id = ${id})`
				)
			)
			.orderBy(desc(bankDeposits.createdAt), asc(bankDeposits.id));

		if (!rows.length) return null;

		const first = rows[0];

		return {
			application: first.applicationId
				? {
						id: first.applicationId,
						status: first.applicationStatus,
						paymentStatus: first.applicationPaymentStatus,
						applicant: first.applicantId
							? {
									id: first.applicantId,
									fullName: first.applicantName,
									nationalId: first.applicantNationalId,
									nationality: first.applicantNationality,
								}
							: null,
						intakePeriod: first.intakePeriodId
							? {
									id: first.intakePeriodId,
									name: first.intakePeriodName,
									localApplicationFee: first.intakePeriodLocalApplicationFee,
									internationalApplicationFee:
										first.intakePeriodInternationalApplicationFee,
								}
							: null,
					}
				: null,
			deposits: rows.map((row) => ({
				id: row.depositId,
				applicationId: row.depositApplicationId,
				documentId: row.documentId,
				receiptId: row.receiptId,
				type: row.type,
				status: row.status,
				reference: row.reference,
				receiptNumber: row.receiptNumber,
				rejectionReason: row.rejectionReason,
				beneficiaryName: row.beneficiaryName,
				dateDeposited: row.dateDeposited,
				amountDeposited: row.amountDeposited,
				currency: row.currency,
				depositorName: row.depositorName,
				bankName: row.bankName,
				paymentMode: row.paymentMode,
				transactionNumber: row.transactionNumber,
				terminalNumber: row.terminalNumber,
				reviewLockedBy: row.reviewLockedBy,
				reviewLockedAt: row.reviewLockedAt,
				createdAt: row.createdAt,
				document: row.documentId
					? {
							id: row.documentId,
							fileName: row.documentFileName,
							fileUrl: row.documentFileUrl,
							type: row.documentType,
							createdAt: row.documentCreatedAt,
						}
					: null,
				receipt: row.receiptId
					? {
							id: row.receiptId,
							receiptNo: row.receiptNo,
							createdBy: row.receiptCreatedBy,
							createdAt: row.receiptCreatedAt,
							createdByUser: row.receiptCreatedByUserId
								? {
										id: row.receiptCreatedByUserId,
										name: row.receiptCreatedByUserName,
									}
								: null,
						}
					: null,
			})),
		};
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

		const notLockedByOthers = currentUserId
			? sql`NOT EXISTS (
				SELECT 1
				FROM bank_deposits sibling
				WHERE sibling.application_id = ${applications.id}
					AND sibling.review_locked_by IS NOT NULL
					AND sibling.review_locked_by <> ${currentUserId}
					AND sibling.review_locked_at >= NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'
			)`
			: sql`NOT EXISTS (
				SELECT 1
				FROM bank_deposits sibling
				WHERE sibling.application_id = ${applications.id}
					AND sibling.review_locked_by IS NOT NULL
					AND sibling.review_locked_at >= NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'
			)`;
		conditions.push(notLockedByOthers);

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

		const statusHaving = filters?.status
			? sql`SUM(CASE WHEN ${bankDeposits.status} = ${filters.status} THEN 1 ELSE 0 END) > 0`
			: undefined;

		const baseQuery = db
			.select({
				id: sql<string>`MIN(${bankDeposits.id})`,
				status: sql<DepositStatus>`CASE
					WHEN SUM(CASE WHEN ${bankDeposits.status} = 'pending' THEN 1 ELSE 0 END) > 0 THEN 'pending'
					WHEN SUM(CASE WHEN ${bankDeposits.status} = 'rejected' THEN 1 ELSE 0 END) > 0 THEN 'rejected'
					ELSE 'verified'
				END`,
				reference: sql<string | null>`MIN(${bankDeposits.reference})`,
				amountDeposited: sql<string>`COALESCE(SUM(COALESCE(${bankDeposits.amountDeposited}, '0')::numeric), 0)::text`,
				documentsCount: sql<number>`COUNT(${bankDeposits.id})`,
				applicationId: applications.id,
				applicantId: applicants.id,
				applicantName: applicants.fullName,
				createdAt: sql<Date | null>`MAX(${bankDeposits.createdAt})`,
			})
			.from(bankDeposits)
			.leftJoin(applications, eq(applications.id, bankDeposits.applicationId))
			.leftJoin(applicants, eq(applicants.id, applications.applicantId))
			.groupBy(applications.id, applicants.id, applicants.fullName);

		const groupedCountQuery = db
			.select({ applicationId: applications.id })
			.from(bankDeposits)
			.leftJoin(applications, eq(applications.id, bankDeposits.applicationId))
			.leftJoin(applicants, eq(applicants.id, applications.applicantId))
			.groupBy(applications.id);

		const [items, countRows] = await Promise.all([
			(() => {
				const query = where ? baseQuery.where(where) : baseQuery;
				const withHaving = statusHaving ? query.having(statusHaving) : query;
				return withHaving
					.orderBy(
						desc(sql`MAX(${bankDeposits.createdAt})`),
						asc(sql`MIN(${bankDeposits.id})`)
					)
					.limit(pageSize)
					.offset(offset);
			})(),
			(() => {
				const query = where
					? groupedCountQuery.where(where)
					: groupedCountQuery;
				const withHaving = statusHaving ? query.having(statusHaving) : query;
				return withHaving;
			})(),
		]);

		const total = countRows.length;

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async acquireLock(depositId: string, userId: string) {
		const updated = await db
			.update(bankDeposits)
			.set({
				reviewLockedBy: userId,
				reviewLockedAt: new Date(),
			})
			.where(
				and(
					eq(
						bankDeposits.applicationId,
						sql`(SELECT application_id FROM bank_deposits WHERE id = ${depositId})`
					),
					sql`NOT EXISTS (
						SELECT 1
						FROM bank_deposits sibling
						WHERE sibling.application_id = ${bankDeposits.applicationId}
							AND sibling.review_locked_by IS NOT NULL
							AND sibling.review_locked_by <> ${userId}
							AND sibling.review_locked_at >= NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'
					)`
				)
			)
			.returning();

		return updated[0] ?? null;
	}

	async releaseLock(depositId: string, userId: string) {
		const updated = await db
			.update(bankDeposits)
			.set({
				reviewLockedBy: null,
				reviewLockedAt: null,
			})
			.where(
				and(
					eq(
						bankDeposits.applicationId,
						sql`(SELECT application_id FROM bank_deposits WHERE id = ${depositId})`
					),
					eq(bankDeposits.reviewLockedBy, userId)
				)
			)
			.returning();

		return updated[0] ?? null;
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
			sql`${applications.id} <> (SELECT application_id FROM bank_deposits WHERE id = ${currentId})`,
			sql`NOT EXISTS (
				SELECT 1
				FROM bank_deposits sibling
				WHERE sibling.application_id = ${applications.id}
					AND sibling.review_locked_by IS NOT NULL
					AND sibling.review_locked_by <> ${userId}
					AND sibling.review_locked_at >= NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'
			)`,
		];

		const where = conditions.reduce((a, b) => sql`${a} AND ${b}`);

		const statusHaving = filters?.status
			? sql`SUM(CASE WHEN ${bankDeposits.status} = ${filters.status} THEN 1 ELSE 0 END) > 0`
			: undefined;

		const baseQuery = db
			.select({ id: sql<string>`MIN(${bankDeposits.id})` })
			.from(bankDeposits)
			.innerJoin(applications, eq(applications.id, bankDeposits.applicationId))
			.where(where)
			.groupBy(applications.id);

		if (statusHaving) {
			const [next] = await baseQuery
				.having(statusHaving)
				.orderBy(
					desc(sql`MAX(${bankDeposits.createdAt})`),
					asc(sql`MIN(${bankDeposits.id})`)
				)
				.limit(1);
			return next ?? null;
		}

		const [next] = await baseQuery
			.orderBy(
				desc(sql`MAX(${bankDeposits.createdAt})`),
				asc(sql`MIN(${bankDeposits.id})`)
			)
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
		const updated = await db
			.update(bankDeposits)
			.set({
				status,
				rejectionReason: status === 'rejected' ? rejectionReason : null,
			})
			.where(
				eq(
					bankDeposits.applicationId,
					sql`(SELECT application_id FROM bank_deposits WHERE id = ${id})`
				)
			)
			.returning();
		return updated[0] ?? null;
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
