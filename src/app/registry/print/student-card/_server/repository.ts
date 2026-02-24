import { desc, eq } from 'drizzle-orm';
import { db, paymentReceipts, studentCardPrints, users } from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';

export default class StudentCardPrintRepository extends BaseRepository<
	typeof studentCardPrints,
	'id'
> {
	constructor() {
		super(studentCardPrints, studentCardPrints.id);
	}

	async findByStdNo(stdNo: number) {
		return db
			.select({
				id: studentCardPrints.id,
				createdAt: studentCardPrints.createdAt,
				receiptNo: paymentReceipts.receiptNo,
				printedByName: users.name,
			})
			.from(studentCardPrints)
			.innerJoin(
				paymentReceipts,
				eq(studentCardPrints.receiptId, paymentReceipts.id)
			)
			.innerJoin(users, eq(studentCardPrints.printedBy, users.id))
			.where(eq(studentCardPrints.stdNo, stdNo))
			.orderBy(desc(studentCardPrints.createdAt));
	}

	async createWithReceipt(
		data: {
			stdNo: number;
			printedBy: string;
			receiptNo: string;
		},
		audit?: AuditOptions
	) {
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

			if (audit) {
				await this.writeAuditLog(
					tx,
					'INSERT',
					String(cardPrint.id),
					null,
					cardPrint,
					audit
				);
			}

			return cardPrint;
		});
	}
}

export const studentCardPrintsRepository = new StudentCardPrintRepository();
