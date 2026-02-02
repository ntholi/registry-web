import { and, desc, eq, sql } from 'drizzle-orm';
import {
	admissionReceipts,
	applications,
	bankDeposits,
	type DepositStatus,
	db,
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
							columns: { id: true, fullName: true, nationalId: true },
						},
						intakePeriod: {
							columns: { id: true, name: true, applicationFee: true },
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
		const conditions: ReturnType<typeof eq>[] = [];

		if (filters?.status) {
			conditions.push(eq(bankDeposits.status, filters.status));
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

		const filtered = search
			? items.filter((item) => {
					if (!item) return false;
					const searchLower = search.toLowerCase();
					return (
						item.reference.toLowerCase().includes(searchLower) ||
						item.application?.applicant?.fullName
							?.toLowerCase()
							.includes(searchLower)
					);
				})
			: items;

		return {
			items: filtered.filter(
				(item): item is NonNullable<typeof item> => item !== null
			),
			totalPages,
			totalItems: search ? filtered.length : totalItems,
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
}
