import { studentCardPrints } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StudentCardPrintRepository from './repository';

type StudentCardPrint = typeof studentCardPrints.$inferInsert;

interface CreateStudentCardPrintData {
	stdNo: number;
	printedBy: string;
	receiptNo: string;
}

class StudentCardPrintService {
	constructor(private readonly repository = new StudentCardPrintRepository()) {}

	async create(data: StudentCardPrint) {
		return withAuth(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
				}),
			['registry']
		);
	}

	async findByStdNo(stdNo: number) {
		return withAuth(
			async () => this.repository.findByStdNo(stdNo),
			['registry']
		);
	}

	async createWithReceipt(data: CreateStudentCardPrintData) {
		return withAuth(
			async (session) =>
				this.repository.createWithReceipt(data, {
					userId: session!.user!.id!,
				}),
			['registry']
		);
	}
}

export const studentCardPrintsService = serviceWrapper(
	StudentCardPrintService,
	'StudentCardPrint'
);
