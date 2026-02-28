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
