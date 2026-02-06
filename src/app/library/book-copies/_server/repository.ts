import { eq } from 'drizzle-orm';
import { bookCopies, db } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class BookCopyRepository extends BaseRepository<
	typeof bookCopies,
	'id'
> {
	constructor() {
		super(bookCopies, bookCopies.id);
	}

	async findByIdWithBook(id: string) {
		return db.query.bookCopies.findFirst({
			where: eq(bookCopies.id, id),
			with: { book: true },
		});
	}

	async findByBookId(bookId: string) {
		return db.query.bookCopies.findMany({
			where: eq(bookCopies.bookId, bookId),
			orderBy: bookCopies.serialNumber,
		});
	}

	async findBySerialNumber(serialNumber: string) {
		return db.query.bookCopies.findFirst({
			where: eq(bookCopies.serialNumber, serialNumber),
			with: { book: true },
		});
	}

	async updateStatus(id: string, status: 'Available' | 'OnLoan' | 'Withdrawn') {
		const [updated] = await db
			.update(bookCopies)
			.set({ status })
			.where(eq(bookCopies.id, id))
			.returning();
		return updated;
	}
}
