import { pgEnum } from 'drizzle-orm/pg-core';

export const paymentType = pgEnum('payment_type', [
	'graduation_gown',
	'graduation_fee',
]);
export type PaymentType = (typeof paymentType.enumValues)[number];
