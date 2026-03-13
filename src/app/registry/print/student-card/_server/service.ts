import type { studentCardPrints } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission, {
	requireSessionUserId,
} from '@/core/platform/withPermission';
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
		return withPermission(
			async (session) =>
				this.repository.create(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_card_print',
					stdNo: data.stdNo,
				}),
			async (session) => session?.user?.role === 'registry'
		);
	}

	async findByStdNo(stdNo: number) {
		return withPermission(
			async () => this.repository.findByStdNo(stdNo),
			async (session) => session?.user?.role === 'registry'
		);
	}

	async createWithReceipt(data: CreateStudentCardPrintData) {
		return withPermission(
			async (session) =>
				this.repository.createWithReceipt(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_card_print',
					stdNo: data.stdNo,
				}),
			async (session) => session?.user?.role === 'registry'
		);
	}
}

export const studentCardPrintsService = serviceWrapper(
	StudentCardPrintService,
	'StudentCardPrint'
);
