import type { studentCardPrints } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth, { requireSessionUserId } from '@/core/platform/withAuth';
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
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_card_print',
					stdNo: data.stdNo,
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
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_card_print',
					stdNo: data.stdNo,
				}),
			['registry']
		);
	}
}

export const studentCardPrintsService = serviceWrapper(
	StudentCardPrintService,
	'StudentCardPrint'
);
