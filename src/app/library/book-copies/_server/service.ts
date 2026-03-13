import type { bookCopies } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import BookCopyRepository from './repository';

class BookCopyService extends BaseService<typeof bookCopies, 'id'> {
	declare repository: BookCopyRepository;

	constructor() {
		super(new BookCopyRepository(), {
			byIdAuth: { library: ['read'] },
			findAllAuth: { library: ['read'] },
			createAuth: { library: ['create'] },
			updateAuth: { library: ['update'] },
			deleteAuth: { library: ['delete'] },
			activityTypes: {
				create: 'book_copy_added',
				update: 'book_copy_updated',
				delete: 'book_copy_deleted',
			},
		});
	}

	async getWithBook(id: string) {
		return withPermission(() => this.repository.findByIdWithBook(id), {
			library: ['read'],
		});
	}

	async findByBookId(bookId: string) {
		return withPermission(() => this.repository.findByBookId(bookId), {
			library: ['read'],
		});
	}

	async findBySerialNumber(serialNumber: string) {
		return withPermission(
			() => this.repository.findBySerialNumber(serialNumber),
			{ library: ['read'] }
		);
	}

	async withdraw(id: string) {
		return withPermission(() => this.repository.updateStatus(id, 'Withdrawn'), {
			library: ['update'],
		});
	}
}

export const bookCopiesService = serviceWrapper(
	BookCopyService,
	'BookCopyService'
);
