import { pgEnum } from 'drizzle-orm/pg-core';

export const receiptType = pgEnum('receipt_type', [
	'graduation_gown',
	'graduation_fee',
	'student_card',
	'repeat_modules',
	'late_registration',
	'tuition_fee',
]);
export type ReceiptType = (typeof receiptType.enumValues)[number];
