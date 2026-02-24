import { and, desc, eq, exists, isNull, lt, or, sql } from 'drizzle-orm';
import {
	bookCopies,
	books,
	db,
	loanRenewals,
	loans,
	students,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';
import type { AvailableCopy, LoanFilters } from '../_lib/types';

export default class LoanRepository extends BaseRepository<typeof loans, 'id'> {
	constructor() {
		super(loans, loans.id);
	}

	async findByIdWithRelations(id: string) {
		const loan = await db.query.loans.findFirst({
			where: eq(loans.id, id),
			with: {
				bookCopy: {
					with: { book: true },
				},
				student: {
					columns: { stdNo: true, name: true },
				},
				issuedByUser: {
					columns: { id: true, name: true },
				},
				returnedToUser: {
					columns: { id: true, name: true },
				},
				renewals: {
					orderBy: desc(loanRenewals.renewedAt),
					with: {
						renewedByUser: {
							columns: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!loan) return null;

		const now = new Date();
		const dueDate = new Date(loan.dueDate);
		const daysOverdue =
			!loan.returnDate && dueDate < now
				? Math.floor(
						(now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
					)
				: 0;

		return { ...loan, daysOverdue };
	}

	async findByStudent(stdNo: number, status?: string) {
		const conditions = [eq(loans.stdNo, stdNo)];
		if (status) {
			conditions.push(eq(loans.status, status as 'Active' | 'Returned'));
		}

		return db.query.loans.findMany({
			where: and(...conditions),
			with: {
				bookCopy: {
					with: { book: true },
				},
			},
			orderBy: desc(loans.loanDate),
		});
	}

	async findActiveLoans() {
		return db.query.loans.findMany({
			where: eq(loans.status, 'Active'),
			with: {
				bookCopy: {
					with: { book: true },
				},
				student: {
					columns: { stdNo: true, name: true },
				},
			},
			orderBy: desc(loans.loanDate),
		});
	}

	async findOverdueLoans() {
		const now = new Date();
		return db.query.loans.findMany({
			where: and(
				eq(loans.status, 'Active'),
				lt(loans.dueDate, now),
				isNull(loans.returnDate)
			),
			with: {
				bookCopy: {
					with: { book: true },
				},
				student: {
					columns: { stdNo: true, name: true },
				},
			},
			orderBy: loans.dueDate,
		});
	}

	async createLoan(
		data: {
			bookCopyId: string;
			stdNo: number;
			dueDate: Date;
			issuedBy: string;
		},
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const [loan] = await tx
				.insert(loans)
				.values({
					bookCopyId: data.bookCopyId,
					stdNo: data.stdNo,
					dueDate: data.dueDate,
					issuedBy: data.issuedBy,
					status: 'Active',
				})
				.returning();

			await tx
				.update(bookCopies)
				.set({ status: 'OnLoan' })
				.where(eq(bookCopies.id, data.bookCopyId));

			if (audit) {
				await this.writeAuditLog(tx, 'INSERT', loan.id, null, loan, audit);
			}

			return loan;
		});
	}

	async processReturn(id: string, returnedTo: string, audit?: AuditOptions) {
		return db.transaction(async (tx) => {
			const loan = await tx.query.loans.findFirst({
				where: eq(loans.id, id),
			});

			if (!loan) throw new Error('Loan not found');

			const now = new Date();
			const dueDate = new Date(loan.dueDate);
			const daysOverdue =
				dueDate < now
					? Math.floor(
							(now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
						)
					: 0;

			const [updated] = await tx
				.update(loans)
				.set({
					returnDate: now,
					status: 'Returned',
					returnedTo,
				})
				.where(eq(loans.id, id))
				.returning();

			if (updated) {
				await tx
					.update(bookCopies)
					.set({ status: 'Available' })
					.where(eq(bookCopies.id, updated.bookCopyId));
			}

			if (audit) {
				await this.writeAuditLog(tx, 'UPDATE', id, loan, updated, {
					...audit,
					stdNo: loan.stdNo,
				});
			}

			return { ...updated, daysOverdue };
		});
	}

	async renewLoan(
		loanId: string,
		newDueDate: Date,
		renewedBy: string,
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const loan = await tx.query.loans.findFirst({
				where: eq(loans.id, loanId),
			});

			if (!loan) throw new Error('Loan not found');

			await tx.insert(loanRenewals).values({
				loanId,
				previousDueDate: loan.dueDate,
				newDueDate,
				renewedBy,
			});

			const [updated] = await tx
				.update(loans)
				.set({ dueDate: newDueDate })
				.where(eq(loans.id, loanId))
				.returning();

			if (audit) {
				await this.writeAuditLog(tx, 'UPDATE', loanId, loan, updated, {
					...audit,
					stdNo: loan.stdNo,
				});
			}

			return updated;
		});
	}

	async getLoanHistory(page: number, search: string, filters?: LoanFilters) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;
		const conditions: ReturnType<typeof eq>[] = [];

		if (filters?.status) {
			if (filters.status === 'Overdue') {
				conditions.push(eq(loans.status, 'Active'));
			} else {
				conditions.push(eq(loans.status, filters.status));
			}
		}

		if (filters?.stdNo) {
			conditions.push(eq(loans.stdNo, filters.stdNo));
		}

		const searchCondition = search
			? or(
					sql`${students.name} ILIKE ${`%${search}%`}`,
					sql`CAST(${students.stdNo} AS TEXT) LIKE ${`%${search}%`}`,
					sql`${books.title} ILIKE ${`%${search}%`}`
				)
			: undefined;

		const baseQuery = db
			.select({
				id: loans.id,
			})
			.from(loans)
			.innerJoin(students, eq(loans.stdNo, students.stdNo))
			.innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
			.innerJoin(books, eq(bookCopies.bookId, books.id));

		const whereConditions =
			conditions.length > 0
				? searchCondition
					? and(...conditions, searchCondition)
					: and(...conditions)
				: searchCondition;

		const overdueCondition =
			filters?.status === 'Overdue'
				? and(lt(loans.dueDate, new Date()), isNull(loans.returnDate))
				: undefined;

		const finalWhere = overdueCondition
			? whereConditions
				? and(whereConditions, overdueCondition)
				: overdueCondition
			: whereConditions;

		const countResult = await baseQuery
			.where(finalWhere)
			.then(
				async () =>
					await db
						.select({ count: sql<number>`count(*)` })
						.from(loans)
						.innerJoin(students, eq(loans.stdNo, students.stdNo))
						.innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
						.innerJoin(books, eq(bookCopies.bookId, books.id))
						.where(finalWhere)
			);

		const totalItems = Number(countResult[0]?.count || 0);
		const totalPages = Math.ceil(totalItems / pageSize);

		const loanIds = await db
			.select({ id: loans.id })
			.from(loans)
			.innerJoin(students, eq(loans.stdNo, students.stdNo))
			.innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
			.innerJoin(books, eq(bookCopies.bookId, books.id))
			.where(finalWhere)
			.orderBy(desc(loans.loanDate))
			.limit(pageSize)
			.offset(offset);

		const items = await Promise.all(
			loanIds.map((l) => this.findByIdWithRelations(l.id))
		);

		return {
			items: items.filter(
				(item): item is NonNullable<typeof item> => item !== null
			),
			totalPages,
			totalItems,
		};
	}

	async searchStudents(query: string) {
		const searchResults = await db
			.select({
				stdNo: students.stdNo,
				name: students.name,
			})
			.from(students)
			.where(
				or(
					sql`${students.name} ILIKE ${`%${query}%`}`,
					sql`CAST(${students.stdNo} AS TEXT) LIKE ${`%${query}%`}`
				)
			)
			.limit(10);

		const resultsWithLoans = await Promise.all(
			searchResults.map(async (student) => {
				const activeLoans = await db
					.select({ count: sql<number>`count(*)` })
					.from(loans)
					.where(
						and(eq(loans.stdNo, student.stdNo), eq(loans.status, 'Active'))
					);

				return {
					...student,
					activeLoansCount: Number(activeLoans[0]?.count || 0),
				};
			})
		);

		return resultsWithLoans;
	}

	async searchBooks(query: string) {
		const searchResults = await db
			.select({
				id: books.id,
				isbn: books.isbn,
				title: books.title,
				coverUrl: books.coverUrl,
			})
			.from(books)
			.where(
				or(
					sql`${books.title} ILIKE ${`%${query}%`}`,
					sql`${books.isbn} ILIKE ${`%${query}%`}`,
					exists(
						db
							.select()
							.from(bookCopies)
							.where(
								and(
									eq(bookCopies.bookId, books.id),
									or(
										sql`${bookCopies.location} ILIKE ${`%${query}%`}`,
										sql`${bookCopies.serialNumber} ILIKE ${`%${query}%`}`
									)
								)
							)
					)
				)
			)
			.limit(10);

		const resultsWithCopies = await Promise.all(
			searchResults.map(async (book) => {
				const copiesData = await db
					.select({
						id: bookCopies.id,
						status: bookCopies.status,
						condition: bookCopies.condition,
						location: bookCopies.location,
						serialNumber: bookCopies.serialNumber,
					})
					.from(bookCopies)
					.where(eq(bookCopies.bookId, book.id));

				const availableCopies = copiesData.filter(
					(c) => c.status === 'Available'
				).length;

				const uniqueLocations = Array.from(
					new Set(copiesData.map((c) => c.location).filter(Boolean) as string[])
				);

				const matchedCopy = copiesData.find(
					(c) =>
						c.status === 'Available' &&
						c.serialNumber.toLowerCase().includes(query.toLowerCase())
				);

				return {
					...book,
					availableCopies,
					locations: uniqueLocations,
					matchedCopy: matchedCopy as AvailableCopy | undefined,
				};
			})
		);

		return resultsWithCopies.filter((b) => b.availableCopies > 0);
	}

	async getAvailableCopies(bookId: string) {
		return db
			.select({
				id: bookCopies.id,
				serialNumber: bookCopies.serialNumber,
				condition: bookCopies.condition,
				location: bookCopies.location,
			})
			.from(bookCopies)
			.where(
				and(eq(bookCopies.bookId, bookId), eq(bookCopies.status, 'Available'))
			);
	}

	async getStudentActiveLoansCount(stdNo: number) {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(loans)
			.where(and(eq(loans.stdNo, stdNo), eq(loans.status, 'Active')));
		return Number(result[0]?.count || 0);
	}
}
