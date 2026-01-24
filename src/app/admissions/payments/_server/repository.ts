import { and, desc, eq, isNotNull, or, sql } from 'drizzle-orm';
import { db, paymentTransactions } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { PaymentFilters, TransactionStatus } from '../_lib/types';

export default class PaymentRepository extends BaseRepository<
	typeof paymentTransactions,
	'id'
> {
	constructor() {
		super(paymentTransactions, paymentTransactions.id);
	}

	async findByIdWithRelations(id: string) {
		return db.query.paymentTransactions.findFirst({
			where: eq(paymentTransactions.id, id),
			with: {
				application: {
					columns: { id: true },
					with: {
						applicant: {
							columns: { id: true, fullName: true },
						},
					},
				},
				markedPaidByUser: {
					columns: { id: true, name: true },
				},
			},
		});
	}

	async findByClientReference(clientReference: string) {
		return db.query.paymentTransactions.findFirst({
			where: eq(paymentTransactions.clientReference, clientReference),
		});
	}

	async findByApplication(applicationId: string) {
		return db.query.paymentTransactions.findMany({
			where: eq(paymentTransactions.applicationId, applicationId),
			orderBy: desc(paymentTransactions.createdAt),
		});
	}

	async findPendingByApplication(applicationId: string) {
		return db.query.paymentTransactions.findFirst({
			where: and(
				eq(paymentTransactions.applicationId, applicationId),
				eq(paymentTransactions.status, 'pending')
			),
			orderBy: desc(paymentTransactions.createdAt),
		});
	}

	async findSuccessfulByApplication(applicationId: string) {
		return db.query.paymentTransactions.findFirst({
			where: and(
				eq(paymentTransactions.applicationId, applicationId),
				eq(paymentTransactions.status, 'success')
			),
		});
	}

	async updateStatus(
		id: string,
		status: TransactionStatus,
		providerReference?: string,
		providerResponse?: unknown
	) {
		const [updated] = await db
			.update(paymentTransactions)
			.set({
				status,
				providerReference,
				providerResponse,
				updatedAt: new Date(),
			})
			.where(eq(paymentTransactions.id, id))
			.returning();
		return updated;
	}

	async markAsPaidManually(
		id: string,
		manualReference: string,
		markedPaidBy: string,
		receiptNumber: string
	) {
		const [updated] = await db
			.update(paymentTransactions)
			.set({
				status: 'success',
				manualReference,
				markedPaidBy,
				receiptNumber,
				updatedAt: new Date(),
			})
			.where(eq(paymentTransactions.id, id))
			.returning();
		return updated;
	}

	async search(page: number, search: string, filters?: PaymentFilters) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;
		const conditions: ReturnType<typeof eq>[] = [];

		if (filters?.status) {
			conditions.push(eq(paymentTransactions.status, filters.status));
		}

		if (filters?.provider) {
			conditions.push(eq(paymentTransactions.provider, filters.provider));
		}

		if (filters?.applicationId) {
			conditions.push(
				eq(paymentTransactions.applicationId, filters.applicationId)
			);
		}

		const searchCondition = search
			? or(
					sql`${paymentTransactions.mobileNumber} ILIKE ${`%${search}%`}`,
					sql`${paymentTransactions.clientReference} ILIKE ${`%${search}%`}`
				)
			: undefined;

		const whereConditions =
			conditions.length > 0
				? searchCondition
					? and(...conditions, searchCondition)
					: and(...conditions)
				: searchCondition;

		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(paymentTransactions)
			.where(
				and(whereConditions, isNotNull(paymentTransactions.applicationId))
			);

		const totalItems = Number(countResult[0]?.count || 0);
		const totalPages = Math.ceil(totalItems / pageSize);

		const transactionIds = await db
			.select({ id: paymentTransactions.id })
			.from(paymentTransactions)
			.where(and(whereConditions, isNotNull(paymentTransactions.applicationId)))
			.orderBy(desc(paymentTransactions.createdAt))
			.limit(pageSize)
			.offset(offset);

		const items = await Promise.all(
			transactionIds.map((t) => this.findByIdWithRelations(t.id))
		);

		return {
			items: items.filter(
				(item): item is NonNullable<typeof item> => item !== null
			),
			totalPages,
			totalItems,
		};
	}

	async countByStatus(status: TransactionStatus) {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(paymentTransactions)
			.where(eq(paymentTransactions.status, status));
		return Number(result[0]?.count || 0);
	}
}
