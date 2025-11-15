import { paymentReceipts } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class PaymentReceiptRepository extends BaseRepository<
	typeof paymentReceipts,
	'id'
> {
	constructor() {
		super(paymentReceipts, paymentReceipts.id);
	}
}

export const paymentReceiptRepository = new PaymentReceiptRepository();
