import { db, paymentReceipts, studentCardPrints } from '@/core/database';
import { auditLogs } from '@/core/database/schema/auditLogs';
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
			async (session) => {
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

					if (session?.user?.id) {
						await tx.insert(auditLogs).values({
							tableName: 'student_card_prints',
							recordId: String(cardPrint.id),
							operation: 'INSERT',
							oldValues: null,
							newValues: cardPrint,
							changedBy: session.user.id,
							metadata: null,
							activityType: null,
						});
					}

					return cardPrint;
				});
			},
			['registry']
		);
	}
}

export const studentCardPrintsService = serviceWrapper(
	StudentCardPrintService,
	'StudentCardPrint'
);
