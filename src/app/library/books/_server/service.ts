import type { books } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import BookRepository from './repository';

class BookService extends BaseService<typeof books, 'id'> {
	declare repository: BookRepository;

	constructor() {
		super(new BookRepository(), {
			byIdAuth: { library: ['read'] },
			findAllAuth: { library: ['read'] },
			createAuth: { library: ['create'] },
			updateAuth: { library: ['update'] },
			deleteAuth: { library: ['delete'] },
			activityTypes: {
				create: 'book_added',
				update: 'book_updated',
				delete: 'book_deleted',
			},
		});
	}

	async getWithRelations(id: string) {
		return withPermission(() => this.repository.findByIdWithRelations(id), {
			library: ['read'],
		});
	}

	async findByIsbn(isbn: string) {
		return withPermission(() => this.repository.findByIsbn(isbn), {
			library: ['read'],
		});
	}

	async createWithRelations(
		book: typeof books.$inferInsert,
		authorIds: string[],
		categoryIds: string[]
	) {
		return withPermission(
			() => this.repository.createWithRelations(book, authorIds, categoryIds),
			{ library: ['create'] }
		);
	}

	async updateWithRelations(
		id: string,
		book: Partial<typeof books.$inferInsert>,
		authorIds: string[],
		categoryIds: string[]
	) {
		return withPermission(
			() =>
				this.repository.updateWithRelations(id, book, authorIds, categoryIds),
			{ library: ['update'] }
		);
	}
}

export const booksService = serviceWrapper(BookService, 'BookService');
