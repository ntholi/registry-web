import type { studentCardPrints } from '@/core/database/schema';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StudentCardPrintRepository from './repository';

type StudentCardPrint = typeof studentCardPrints.$inferInsert;

class StudentCardPrintService {
	constructor(private readonly repository = new StudentCardPrintRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: string) {
		return withAuth(async () => this.repository.findById(id), ['registry']);
	}

	async getAll(params: QueryOptions<typeof studentCardPrints>) {
		return withAuth(async () => this.repository.query(params), ['registry']);
	}

	async create(data: StudentCardPrint) {
		return withAuth(async () => this.repository.create(data), ['registry']);
	}

	async update(id: string, data: Partial<StudentCardPrint>) {
		return withAuth(async () => this.repository.update(id, data), ['registry']);
	}

	async delete(id: string) {
		return withAuth(async () => this.repository.delete(id), []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}
}

export const studentCardPrintsService = serviceWrapper(
	StudentCardPrintService,
	'StudentCardPrint'
);
