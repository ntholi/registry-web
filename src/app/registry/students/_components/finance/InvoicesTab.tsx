'use client';

import { fetchInvoiceDetail } from '@finance/_lib/zoho-books/actions';
import type {
	ZohoInvoice,
	ZohoInvoiceStatus,
} from '@finance/_lib/zoho-books/types';
import { Card, Divider, Group, Skeleton, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { statusColors } from '@/shared/lib/utils/colors';
import {
	CurrencyCell,
	DateCell,
	LineItemsTable,
	NumberCell,
	StatusBadge,
	type TransactionColumn,
	TransactionTable,
} from './TransactionTable';

type Props = {
	invoices: ZohoInvoice[];
};

const LABEL_MAP: Record<ZohoInvoiceStatus, string> = {
	draft: 'Draft',
	sent: 'Sent',
	overdue: 'Overdue',
	paid: 'Paid',
	partially_paid: 'Partial',
	unpaid: 'Unpaid',
	viewed: 'Viewed',
	void: 'Void',
};

const columns: TransactionColumn<ZohoInvoice>[] = [
	{
		key: 'date',
		label: 'Date',
		render: (row) => <DateCell date={row.date} />,
	},
	{
		key: 'number',
		label: 'Invoice #',
		render: (row) => <NumberCell value={row.invoice_number} />,
	},
	{
		key: 'total',
		label: 'Amount',
		align: 'right',
		render: (row) => <CurrencyCell amount={row.total} />,
	},
	{
		key: 'balance',
		label: 'Balance Due',
		align: 'right',
		render: (row) => (
			<CurrencyCell
				amount={row.balance}
				color={row.balance > 0 ? 'red' : undefined}
			/>
		),
	},
	{
		key: 'status',
		label: 'Status',
		align: 'center',
		render: (row) => (
			<StatusBadge
				status={row.status}
				colorMap={statusColors.invoiceStatus}
				labelMap={LABEL_MAP}
			/>
		),
	},
];

export function InvoicesTab({ invoices }: Props) {
	return (
		<Stack gap='sm'>
			<TransactionTable
				data={invoices}
				columns={columns}
				rowKey={(r) => r.invoice_id}
				emptyLabel='No invoices found.'
				renderDetail={(row) => <InvoiceDetail invoice={row} />}
			/>
		</Stack>
	);
}

type InvoiceDetailProps = {
	invoice: ZohoInvoice;
};

function InvoiceDetail({ invoice }: InvoiceDetailProps) {
	const { data: detail, isLoading } = useQuery({
		queryKey: ['invoice-detail', invoice.invoice_id],
		queryFn: () => fetchInvoiceDetail(invoice.invoice_id),
		staleTime: 1000 * 60 * 10,
	});

	const currency = invoice.currency_code ?? 'LSL';
	const lineItems = detail?.line_items ?? [];
	const subTotal =
		detail?.sub_total ??
		(lineItems.length > 0
			? lineItems.reduce((s, it) => s + it.item_total, 0)
			: invoice.total);
	const paid = invoice.total - invoice.balance;
	const fmt = (n: number) =>
		n.toLocaleString('en', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

	return (
		<Stack gap='sm'>
			{isLoading ? (
				<Stack gap='xs'>
					<Skeleton height={14} width={120} />
					<Skeleton height={60} />
				</Stack>
			) : lineItems.length > 0 ? (
				<LineItemsTable items={lineItems} />
			) : (
				<Text size='sm' c='dimmed'>
					No line items
				</Text>
			)}
			<Group justify='flex-end'>
				<Card withBorder>
					<Stack gap={4} w={300}>
						<SummaryRow label='Sub Total' value={fmt(subTotal)} />
						<Divider my={4} />
						<SummaryRow
							label='Total'
							value={`${currency}${fmt(invoice.total)}`}
							bold
						/>
						<SummaryRow
							label='Payment Made'
							value={`(-) ${fmt(paid)}`}
							color='red'
						/>
						<Divider my={4} />
						<SummaryRow
							label='Balance Due'
							value={`${currency}${fmt(invoice.balance)}`}
							bold
							color={invoice.balance > 0 ? 'red' : undefined}
						/>
					</Stack>
				</Card>
			</Group>
		</Stack>
	);
}

type SummaryRowProps = {
	label: string;
	value: string;
	bold?: boolean;
	color?: string;
};

function SummaryRow({ label, value, bold, color }: SummaryRowProps) {
	return (
		<Group justify='space-between'>
			<Text size='sm' c={bold ? undefined : 'dimmed'} fw={bold ? 600 : 400}>
				{label}
			</Text>
			<Text size='sm' fw={bold ? 700 : 500} ff='monospace' c={color}>
				{value}
			</Text>
		</Group>
	);
}
