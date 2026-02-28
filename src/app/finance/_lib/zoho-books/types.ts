export interface ZohoContactTag {
	tag_id: string;
	tag_name: string;
	tag_option_id: string;
	tag_option_name: string;
	is_tag_mandatory: boolean;
}

export interface ZohoCustomField {
	field_id: string;
	index: number;
	value?: string;
	label: string;
	api_name: string;
	data_type: string;
}

export interface ZohoContact {
	contact_id: string;
	contact_name?: string;
	first_name?: string;
	last_name?: string;
	company_name?: string;
	contact_number?: string;
	email?: string;
	status?: string;
	customer_sub_type?: string;
	source?: string;
	custom_fields?: ZohoCustomField[];
	tags?: ZohoContactTag[];
	cf_account_code?: string;
	notes?: string;
	has_transaction?: boolean;
	outstanding_receivable_amount?: number;
	unused_credits_receivable_amount?: number;
}

export interface ZohoContactsResponse {
	code: number;
	message: string;
	contacts?: ZohoContact[];
}

export interface ZohoLineItem {
	line_item_id: string;
	item_id?: string;
	name?: string;
	description?: string;
	quantity: number;
	rate: number;
	item_total: number;
}

export type ZohoInvoiceStatus =
	| 'draft'
	| 'sent'
	| 'overdue'
	| 'paid'
	| 'partially_paid'
	| 'unpaid'
	| 'viewed'
	| 'void';

export interface ZohoInvoice {
	invoice_id: string;
	invoice_number: string;
	customer_id: string;
	customer_name: string;
	status: ZohoInvoiceStatus;
	date: string;
	due_date: string;
	total: number;
	balance: number;
	line_items?: ZohoLineItem[];
	reference_number?: string;
	currency_code?: string;
}

export interface ZohoInvoicesResponse {
	code: number;
	message: string;
	invoices?: ZohoInvoice[];
}

export interface ZohoInvoiceDetailResponse {
	code: number;
	message: string;
	invoice: ZohoInvoice;
}

export interface StudentInvoiceSummary {
	totalInvoices: number;
	totalAmount: number;
	totalPaid: number;
	totalOutstanding: number;
	invoices: ZohoInvoice[];
}

export type ZohoPaymentStatus = '' | 'void';

export interface ZohoPayment {
	payment_id: string;
	payment_number: string;
	customer_id: string;
	customer_name: string;
	date: string;
	amount: number;
	unused_amount: number;
	payment_mode: string;
	reference_number?: string;
	description?: string;
	status: ZohoPaymentStatus;
	currency_code?: string;
	invoices?: {
		invoice_id: string;
		invoice_number: string;
		amount_applied: number;
	}[];
}

export interface ZohoPaymentsResponse {
	code: number;
	message: string;
	customerpayments?: ZohoPayment[];
}

export interface ZohoPaymentDetailResponse {
	code: number;
	message: string;
	payment: ZohoPayment;
}

export type ZohoEstimateStatus =
	| 'draft'
	| 'sent'
	| 'invoiced'
	| 'accepted'
	| 'declined'
	| 'expired';

export interface ZohoEstimate {
	estimate_id: string;
	estimate_number: string;
	customer_id: string;
	customer_name: string;
	status: ZohoEstimateStatus;
	date: string;
	expiry_date?: string;
	total: number;
	line_items?: ZohoLineItem[];
	reference_number?: string;
	currency_code?: string;
}

export interface ZohoEstimatesResponse {
	code: number;
	message: string;
	estimates?: ZohoEstimate[];
}

export interface ZohoEstimateDetailResponse {
	code: number;
	message: string;
	estimate: ZohoEstimate;
}

export type ZohoSalesReceiptStatus = 'draft' | 'confirmed' | 'void';

export interface ZohoSalesReceipt {
	salesreceipt_id: string;
	salesreceipt_number: string;
	customer_id: string;
	customer_name: string;
	status: ZohoSalesReceiptStatus;
	date: string;
	total: number;
	line_items?: ZohoLineItem[];
	reference_number?: string;
	payment_mode?: string;
	currency_code?: string;
}

export interface ZohoSalesReceiptsResponse {
	code: number;
	message: string;
	salesreceipts?: ZohoSalesReceipt[];
}

export interface ZohoSalesReceiptDetailResponse {
	code: number;
	message: string;
	salesreceipt: ZohoSalesReceipt;
}

export type ZohoCreditNoteStatus = 'draft' | 'open' | 'closed' | 'void';

export interface ZohoCreditNote {
	creditnote_id: string;
	creditnote_number: string;
	customer_id: string;
	customer_name: string;
	status: ZohoCreditNoteStatus;
	date: string;
	total: number;
	balance: number;
	line_items?: ZohoLineItem[];
	reference_number?: string;
	currency_code?: string;
}

export interface ZohoCreditNotesResponse {
	code: number;
	message: string;
	creditnotes?: ZohoCreditNote[];
}

export interface ZohoCreditNoteDetailResponse {
	code: number;
	message: string;
	creditnote: ZohoCreditNote;
}

export interface StudentFinanceSummary {
	contactId: string;
	totalAmount: number;
	totalPaid: number;
	totalOutstanding: number;
	unusedCredits: number;
	invoices: ZohoInvoice[];
	payments: ZohoPayment[];
	estimates: ZohoEstimate[];
	salesReceipts: ZohoSalesReceipt[];
}
