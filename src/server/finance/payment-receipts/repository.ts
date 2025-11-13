import { paymentReceipts } from '@/core/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class PaymentReceiptRepository extends BaseRepository<
	typeof paymentReceipts,
	'id'
> {
	constructor() {
		super(paymentReceipts, paymentReceipts.id);
	}
}

export const paymentReceiptRepository = new PaymentReceiptRepository();
