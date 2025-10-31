import type { studentCardPrints } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import type { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '../base/serviceWrapper';
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

export const studentCardPrintsService = serviceWrapper(StudentCardPrintService, 'StudentCardPrint');
