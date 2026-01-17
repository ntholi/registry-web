import { relations } from 'drizzle-orm';
import {
	graduationRequestReceipts,
	studentCardPrints,
	students,
	users,
} from '@/core/database';
import { paymentReceipts } from './paymentReceipts';

export const paymentReceiptsRelations = relations(
	paymentReceipts,
	({ one, many }) => ({
		student: one(students, {
			fields: [paymentReceipts.stdNo],
			references: [students.stdNo],
		}),
		createdByUser: one(users, {
			fields: [paymentReceipts.createdBy],
			references: [users.id],
		}),
		graduationRequestReceipts: many(graduationRequestReceipts),
		studentCardPrints: many(studentCardPrints),
	})
);
