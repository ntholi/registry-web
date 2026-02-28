'use client';

import { fetchInvoiceDetail } from '@finance/_lib/zoho-books/actions';
import type {
	ZohoInvoice,
	ZohoInvoiceStatus,
} from '@finance/_lib/zoho-books/types';
import { Group, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { statusColors } from '@/shared/lib/utils/colors';
import { formatCurrency } from '@/shared/lib/utils/utils';
import {
	CurrencyCell,
	DateCell,
	DetailField,
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

	const paid = invoice.total - invoice.balance;

	return (
		<Stack gap='sm'>
			<Paper p='sm' radius='sm' withBorder>
				<Group justify='space-between'>
					<DetailField
						label='Total'
						value={
							<Text fw={700} ff='monospace' size='sm'>
								{formatCurrency(invoice.total)}
							</Text>
						}
					/>
					<DetailField
						label='Paid'
						value={
							<Text fw={700} ff='monospace' size='sm' c='green'>
								{formatCurrency(paid)}
							</Text>
						}
					/>
					<DetailField
						label='Balance Due'
						value={
							<Text
								fw={700}
								ff='monospace'
								size='sm'
								c={invoice.balance > 0 ? 'red' : 'green'}
							>
								{formatCurrency(invoice.balance)}
							</Text>
						}
					/>
				</Group>
			</Paper>

			{isLoading ? (
				<Stack gap='xs'>
					{Array.from({ length: 2 }).map((_, i) => (
						<Skeleton height={24} key={`line-${i}`} />
					))}
				</Stack>
			) : (
				detail?.line_items &&
				detail.line_items.length > 0 && (
					<LineItemsTable items={detail.line_items} />
				)
			)}
		</Stack>
	);
}
