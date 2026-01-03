import type { studentCardPrints } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StudentCardPrintRepository from './repository';

type StudentCardPrint = typeof studentCardPrints.$inferInsert;

class StudentCardPrintService {
	constructor(private readonly repository = new StudentCardPrintRepository()) {}

	async create(data: StudentCardPrint) {
		return withAuth(async () => this.repository.create(data), ['registry']);
	}
}

export const studentCardPrintsService = serviceWrapper(
	StudentCardPrintService,
	'StudentCardPrint'
);
