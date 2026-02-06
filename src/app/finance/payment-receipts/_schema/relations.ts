import { users } from '@auth/users/_schema/users';
import { studentCardPrints } from '@registry/print/_schema/studentCardPrints';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { graduationRequestReceipts } from '@/app/registry/graduation/clearance/_schema/graduationRequestReceipts';
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
