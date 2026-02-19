import { desc, eq } from 'drizzle-orm';
import { db, paymentReceipts, studentCardPrints, users } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

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
}

export const studentCardPrintsRepository = new StudentCardPrintRepository();
