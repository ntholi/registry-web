import BaseRepository from '@/server/base/BaseRepository';
import { paymentReceipts } from '@/db/schema';

export default class PaymentReceiptRepository extends BaseRepository<
  typeof paymentReceipts,
  'id'
> {
  constructor() {
    super(paymentReceipts, paymentReceipts.id);
  }
}

export const paymentReceiptRepository = new PaymentReceiptRepository();
