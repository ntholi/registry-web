import type { bookCopies } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import BookCopyRepository from './repository';

class BookCopyService extends BaseService<typeof bookCopies, 'id'> {
	declare repository: BookCopyRepository;

	constructor() {
		super(new BookCopyRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
			activityTypes: {
				create: 'book_copy_added',
				update: 'book_copy_updated',
			},
		});
	}

	async getWithBook(id: string) {
		return this.repository.findByIdWithBook(id);
	}

	async findByBookId(bookId: string) {
		return this.repository.findByBookId(bookId);
	}

	async findBySerialNumber(serialNumber: string) {
		return this.repository.findBySerialNumber(serialNumber);
	}

	async withdraw(id: string) {
		return this.repository.updateStatus(id, 'Withdrawn');
	}
}

export const bookCopiesService = serviceWrapper(
	BookCopyService,
	'BookCopyService'
);
