import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';
import {
	books,
	db,
	reservations,
	students,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { ReservationFilters } from '../_lib/types';

export default class ReservationRepository extends BaseRepository<typeof reservations, 'id'> {
	constructor() {
		super(reservations, reservations.id);
	}

	async findByIdWithRelations(id: string) {
		const reservation = await db.query.reservations.findFirst({
			where: eq(reservations.id, id),
			with: {
				book: true,
				student: {
					columns: { stdNo: true, name: true },
				},
				reservedByUser: {
					columns: { id: true, name: true },
				},
				fulfilledByUser: {
					columns: { id: true, name: true },
				},
				cancelledByUser: {
					columns: { id: true, name: true },
				},
			},
		});

		if (!reservation) return null;

		const now = new Date();
		const expiryDate = new Date(reservation.expiryDate);
		const isExpired =
			reservation.status === 'Active' && expiryDate < now;

		return { ...reservation, isExpired };
	}

	async findByStudent(stdNo: number, status?: string) {
		const conditions = [eq(reservations.stdNo, stdNo)];
		if (status) {
			conditions.push(eq(reservations.status, status as 'Active' | 'Fulfilled' | 'Cancelled' | 'Expired'));
		}

		return db.query.reservations.findMany({
			where: and(...conditions),
			with: {
				book: true,
			},
			orderBy: desc(reservations.reservationDate),
		});
	}

	async findActiveReservations() {
		return db.query.reservations.findMany({
			where: eq(reservations.status, 'Active'),
			with: {
				book: true,
				student: {
					columns: { stdNo: true, name: true },
				},
			},
			orderBy: desc(reservations.reservationDate),
		});
	}

	async findExpiredReservations() {
		const now = new Date();
		return db.query.reservations.findMany({
			where: and(
				eq(reservations.status, 'Active'),
				lt(reservations.expiryDate, now)
			),
			with: {
				book: true,
				student: {
					columns: { stdNo: true, name: true },
				},
			},
			orderBy: reservations.expiryDate,
		});
	}

	async createReservation(data: {
		bookId: string;
		stdNo: number;
		expiryDate: Date;
		reservedBy?: string;
		notes?: string;
	}) {
		const [reservation] = await db
			.insert(reservations)
			.values({
				bookId: data.bookId,
				stdNo: data.stdNo,
				expiryDate: data.expiryDate,
				reservedBy: data.reservedBy,
				notes: data.notes,
				status: 'Active',
			})
			.returning();

		return reservation;
	}

	async cancelReservation(id: string, cancelledBy: string) {
		const now = new Date();
		const [updated] = await db
			.update(reservations)
			.set({
				status: 'Cancelled',
				cancelledBy,
				cancelledAt: now,
			})
			.where(eq(reservations.id, id))
			.returning();

		return updated;
	}

	async fulfillReservation(id: string, fulfilledBy: string) {
		const now = new Date();
		const [updated] = await db
			.update(reservations)
			.set({
				status: 'Fulfilled',
				fulfilledBy,
				fulfilledAt: now,
			})
			.where(eq(reservations.id, id))
			.returning();

		return updated;
	}

	async markExpired(id: string) {
		const [updated] = await db
			.update(reservations)
			.set({
				status: 'Expired',
			})
			.where(eq(reservations.id, id))
			.returning();

		return updated;
	}

	async getReservationHistory(page: number, search: string, filters?: ReservationFilters) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;
		const conditions: ReturnType<typeof eq>[] = [];

		if (filters?.status) {
			if (filters.status === 'Expired') {
				conditions.push(eq(reservations.status, 'Active'));
			} else {
				conditions.push(eq(reservations.status, filters.status));
			}
		}

		if (filters?.stdNo) {
			conditions.push(eq(reservations.stdNo, filters.stdNo));
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
				id: reservations.id,
			})
			.from(reservations)
			.innerJoin(students, eq(reservations.stdNo, students.stdNo))
			.innerJoin(books, eq(reservations.bookId, books.id));

		const whereConditions =
			conditions.length > 0
				? searchCondition
					? and(...conditions, searchCondition)
					: and(...conditions)
				: searchCondition;

		const expiredCondition =
			filters?.status === 'Expired'
				? lt(reservations.expiryDate, new Date())
				: undefined;

		const finalWhere = expiredCondition
			? whereConditions
				? and(whereConditions, expiredCondition)
				: expiredCondition
			: whereConditions;

		const countResult = await baseQuery
			.where(finalWhere)
			.then(
				async () =>
					await db
						.select({ count: sql<number>`count(*)` })
						.from(reservations)
						.innerJoin(students, eq(reservations.stdNo, students.stdNo))
						.innerJoin(books, eq(reservations.bookId, books.id))
						.where(finalWhere)
			);

		const totalItems = Number(countResult[0]?.count || 0);
		const totalPages = Math.ceil(totalItems / pageSize);

		const reservationIds = await db
			.select({ id: reservations.id })
			.from(reservations)
			.innerJoin(students, eq(reservations.stdNo, students.stdNo))
			.innerJoin(books, eq(reservations.bookId, books.id))
			.where(finalWhere)
			.orderBy(desc(reservations.reservationDate))
			.limit(pageSize)
			.offset(offset);

		const items = await Promise.all(
			reservationIds.map((r) => this.findByIdWithRelations(r.id))
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

		const resultsWithReservations = await Promise.all(
			searchResults.map(async (student) => {
				const activeReservations = await db
					.select({ count: sql<number>`count(*)` })
					.from(reservations)
					.where(
						and(eq(reservations.stdNo, student.stdNo), eq(reservations.status, 'Active'))
					);

				return {
					...student,
					activeReservationsCount: Number(activeReservations[0]?.count || 0),
				};
			})
		);

		return resultsWithReservations;
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
					sql`${books.isbn} ILIKE ${`%${query}%`}`
				)
			)
			.limit(10);

		return searchResults;
	}

	async getStudentActiveReservationsCount(stdNo: number) {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(reservations)
			.where(and(eq(reservations.stdNo, stdNo), eq(reservations.status, 'Active')));
		return Number(result[0]?.count || 0);
	}

	async hasActiveReservation(bookId: string, stdNo: number) {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(reservations)
			.where(
				and(
					eq(reservations.bookId, bookId),
					eq(reservations.stdNo, stdNo),
					eq(reservations.status, 'Active')
				)
			);
		return Number(result[0]?.count || 0) > 0;
	}
}
