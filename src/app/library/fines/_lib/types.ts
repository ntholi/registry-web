import type { fines } from '@/core/database';

export type Fine = typeof fines.$inferSelect;
export type FineInsert = typeof fines.$inferInsert;

export type FineStatus = 'Unpaid' | 'Paid';

export interface FineWithRelations extends Fine {
	loan: {
		id: string;
		loanDate: Date | null;
		dueDate: Date;
		returnDate: Date | null;
		bookCopy: {
			id: string;
			serialNumber: string;
			book: {
				id: string;
				title: string;
				isbn: string;
			};
		};
	};
	student: {
		stdNo: number;
		name: string;
	};
	receipt: {
		id: string;
		receiptNo: string;
	} | null;
}
