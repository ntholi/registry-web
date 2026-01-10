import { pgEnum } from 'drizzle-orm/pg-core';

export const bookCondition = pgEnum('book_condition', [
	'New',
	'Good',
	'Damaged',
]);
export type BookCondition = (typeof bookCondition.enumValues)[number];

export const bookCopyStatus = pgEnum('book_copy_status', [
	'Available',
	'OnLoan',
	'Withdrawn',
]);
export type BookCopyStatus = (typeof bookCopyStatus.enumValues)[number];

export const loanStatus = pgEnum('loan_status', [
	'Active',
	'Returned',
	'Overdue',
]);
export type LoanStatus = (typeof loanStatus.enumValues)[number];

export const fineStatus = pgEnum('fine_status', ['Unpaid', 'Paid']);
export type FineStatus = (typeof fineStatus.enumValues)[number];

export const resourceType = pgEnum('resource_type', [
	'PastPaper',
	'ResearchPaper',
	'Thesis',
	'Journal',
	'Other',
]);
export type ResourceType = (typeof resourceType.enumValues)[number];
