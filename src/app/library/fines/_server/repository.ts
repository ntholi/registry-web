import { and, desc, eq, sql, sum } from 'drizzle-orm';
import { bookCopies, books, db, fines, loans, students } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { FineStatus } from '../_lib/types';

export default class FineRepository extends BaseRepository<typeof fines, 'id'> {
	constructor() {
		super(fines, fines.id);
	}

	async findByIdWithRelations(id: string) {
		return db.query.fines.findFirst({
			where: eq(fines.id, id),
			with: {
				loan: {
					with: {
						bookCopy: {
							with: {
								book: {
									columns: { id: true, title: true, isbn: true },
								},
							},
						},
					},
				},
				student: {
					columns: { stdNo: true, name: true },
				},
				receipt: {
					columns: { id: true, receiptNo: true },
				},
			},
		});
	}

	async findByStudent(stdNo: number) {
		return db.query.fines.findMany({
			where: eq(fines.stdNo, stdNo),
			with: {
				loan: {
					with: {
						bookCopy: {
							with: {
								book: {
									columns: { id: true, title: true, isbn: true },
								},
							},
						},
					},
				},
				receipt: {
					columns: { id: true, receiptNo: true },
				},
			},
			orderBy: desc(fines.createdAt),
		});
	}

	async findByStatus(status: FineStatus) {
		return db.query.fines.findMany({
			where: eq(fines.status, status),
			with: {
				loan: {
					with: {
						bookCopy: {
							with: {
								book: {
									columns: { id: true, title: true, isbn: true },
								},
							},
						},
					},
				},
				student: {
					columns: { stdNo: true, name: true },
				},
				receipt: {
					columns: { id: true, receiptNo: true },
				},
			},
			orderBy: desc(fines.createdAt),
		});
	}

	async findByLoan(loanId: string) {
		return db.query.fines.findFirst({
			where: eq(fines.loanId, loanId),
			with: {
				receipt: {
					columns: { id: true, receiptNo: true },
				},
			},
		});
	}

	async createFine(
		loanId: string,
		stdNo: number,
		amount: number,
		daysOverdue: number
	) {
		const [fine] = await db
			.insert(fines)
			.values({
				loanId,
				stdNo,
				amount,
				daysOverdue,
				status: 'Unpaid',
			})
			.returning();
		return fine;
	}

	async markPaid(id: string, receiptId: string) {
		const [updated] = await db
			.update(fines)
			.set({
				status: 'Paid',
				receiptId,
				paidAt: new Date(),
			})
			.where(eq(fines.id, id))
			.returning();
		return updated;
	}

	async getTotalUnpaidByStudent(stdNo: number) {
		const result = await db
			.select({ total: sum(fines.amount) })
			.from(fines)
			.where(and(eq(fines.stdNo, stdNo), eq(fines.status, 'Unpaid')));
		return Number(result[0]?.total ?? 0);
	}

	async getFinesWithFilters(page: number, search: string, status?: FineStatus) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (status) {
			conditions.push(eq(fines.status, status));
		}

		if (search) {
			conditions.push(
				sql`${students.name} ILIKE ${`%${search}%`} OR ${students.stdNo}::text LIKE ${`%${search}%`}`
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const data = await db
			.select({
				id: fines.id,
				loanId: fines.loanId,
				stdNo: fines.stdNo,
				amount: fines.amount,
				daysOverdue: fines.daysOverdue,
				status: fines.status,
				createdAt: fines.createdAt,
				paidAt: fines.paidAt,
				studentName: students.name,
				bookTitle: books.title,
			})
			.from(fines)
			.innerJoin(students, eq(fines.stdNo, students.stdNo))
			.innerJoin(loans, eq(fines.loanId, loans.id))
			.innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
			.innerJoin(books, eq(bookCopies.bookId, books.id))
			.where(whereClause)
			.orderBy(desc(fines.createdAt))
			.limit(pageSize)
			.offset(offset);

		const [{ count: total }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(fines)
			.innerJoin(students, eq(fines.stdNo, students.stdNo))
			.where(whereClause);

		return {
			items: data,
			totalPages: Math.ceil(Number(total) / pageSize),
		};
	}
}
