import { eq } from 'drizzle-orm';
import { bookAuthors, books, db } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class BookRepository extends BaseRepository<typeof books, 'id'> {
	constructor() {
		super(books, books.id);
	}

	async findByIdWithRelations(id: number) {
		const book = await db.query.books.findFirst({
			where: eq(books.id, id),
			with: {
				bookAuthors: {
					with: { author: true },
				},
				bookCopies: true,
			},
		});

		if (!book) return null;

		const availableCopies = book.bookCopies.filter(
			(c) => c.status === 'Available'
		).length;
		const totalCopies = book.bookCopies.filter(
			(c) => c.status !== 'Withdrawn'
		).length;

		return { ...book, availableCopies, totalCopies };
	}

	async findByIsbn(isbn: string) {
		return db.query.books.findFirst({
			where: eq(books.isbn, isbn),
		});
	}

	async createWithRelations(
		book: typeof books.$inferInsert,
		authorIds: number[]
	) {
		return db.transaction(async (tx) => {
			const [newBook] = await tx.insert(books).values(book).returning();

			if (authorIds.length > 0) {
				await tx.insert(bookAuthors).values(
					authorIds.map((authorId) => ({
						bookId: newBook.id,
						authorId,
					}))
				);
			}

			return newBook;
		});
	}

	async updateWithRelations(
		id: number,
		book: Partial<typeof books.$inferInsert>,
		authorIds: number[]
	) {
		return db.transaction(async (tx) => {
			const [updated] = await tx
				.update(books)
				.set(book)
				.where(eq(books.id, id))
				.returning();

			await tx.delete(bookAuthors).where(eq(bookAuthors.bookId, id));

			if (authorIds.length > 0) {
				await tx.insert(bookAuthors).values(
					authorIds.map((authorId) => ({
						bookId: id,
						authorId,
					}))
				);
			}

			return updated;
		});
	}
}
