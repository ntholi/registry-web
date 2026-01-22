import type { books } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import BookRepository from './repository';

class BookService extends BaseService<typeof books, 'id'> {
	declare repository: BookRepository;

	constructor() {
		super(new BookRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}

	async getWithRelations(id: number) {
		return this.repository.findByIdWithRelations(id);
	}

	async findByIsbn(isbn: string) {
		return this.repository.findByIsbn(isbn);
	}

	async createWithRelations(
		book: typeof books.$inferInsert,
		authorIds: number[],
		categoryIds: number[]
	) {
		return this.repository.createWithRelations(book, authorIds, categoryIds);
	}

	async updateWithRelations(
		id: number,
		book: Partial<typeof books.$inferInsert>,
		authorIds: number[],
		categoryIds: number[]
	) {
		return this.repository.updateWithRelations(
			id,
			book,
			authorIds,
			categoryIds
		);
	}
}

export const booksService = serviceWrapper(BookService, 'BookService');
