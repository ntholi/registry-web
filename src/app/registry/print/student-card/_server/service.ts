import { db, paymentReceipts, studentCardPrints } from '@/core/database';
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
		return withAuth(async () => this.repository.create(data), ['registry']);
	}

	async createWithReceipt(data: CreateStudentCardPrintData) {
		return withAuth(async () => {
			return db.transaction(async (tx) => {
				const [receipt] = await tx
					.insert(paymentReceipts)
					.values({
						receiptNo: data.receiptNo,
						receiptType: 'student_card',
						stdNo: data.stdNo,
						createdBy: data.printedBy,
					})
					.returning();

				const [cardPrint] = await tx
					.insert(studentCardPrints)
					.values({
						stdNo: data.stdNo,
						printedBy: data.printedBy,
						receiptId: receipt.id,
					})
					.returning();

				return cardPrint;
			});
		}, ['registry']);
	}
}

export const studentCardPrintsService = serviceWrapper(
	StudentCardPrintService,
	'StudentCardPrint'
);
