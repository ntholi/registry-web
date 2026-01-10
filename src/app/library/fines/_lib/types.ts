import type { fines } from '@/core/database';

export type Fine = typeof fines.$inferSelect;
export type FineInsert = typeof fines.$inferInsert;

export type FineStatus = 'Unpaid' | 'Paid';

export interface FineWithRelations extends Fine {
	loan: {
		id: number;
		loanDate: Date | null;
		dueDate: Date;
		returnDate: Date | null;
		bookCopy: {
			id: number;
			serialNumber: string;
			book: {
				id: number;
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
