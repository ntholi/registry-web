'use client';

import { fetchInvoiceDetail } from '@finance/_lib/zoho-books/actions';
import type {
	ZohoInvoice,
	ZohoInvoiceStatus,
} from '@finance/_lib/zoho-books/types';
import {
	Divider,
	Group,
	SegmentedControl,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { statusColors } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
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

const FILTERS = [
	{ label: 'All', value: 'all' },
	{ label: 'Paid', value: 'paid' },
	{ label: 'Unpaid', value: 'unpaid' },
	{ label: 'Overdue', value: 'overdue' },
	{ label: 'Partial', value: 'partially_paid' },
] as const;

type Filter = (typeof FILTERS)[number]['value'];

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
		key: 'ref',
		label: 'Reference',
		render: (row) => (
			<Text size='sm' c='dimmed'>
				{row.reference_number || '-'}
			</Text>
		),
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
	const [filter, setFilter] = useState<Filter>('all');

	const filtered =
		filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);

	return (
		<Stack gap='sm'>
			<Group justify='flex-end'>
				<SegmentedControl
					size='xs'
					value={filter}
					onChange={(v) => setFilter(v as Filter)}
					data={FILTERS.map((f) => ({ label: f.label, value: f.value }))}
				/>
			</Group>
			<TransactionTable
				data={filtered}
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
		<Stack gap='md'>
			<SimpleGrid cols={{ base: 2, sm: 4 }} spacing='md'>
				<DetailField
					label='Invoice Date'
					value={formatDate(invoice.date, 'short')}
				/>
				<DetailField
					label='Due Date'
					value={formatDate(invoice.due_date, 'short')}
				/>
				<DetailField
					label='Reference'
					value={invoice.reference_number || '-'}
				/>
				<DetailField
					label='Status'
					value={
						<StatusBadge
							status={invoice.status}
							colorMap={statusColors.invoiceStatus}
							labelMap={LABEL_MAP}
						/>
					}
				/>
			</SimpleGrid>

			<SimpleGrid cols={{ base: 3 }} spacing='md'>
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
			</SimpleGrid>

			{isLoading ? (
				<Stack gap='xs'>
					<Skeleton height={12} width={80} />
					{Array.from({ length: 2 }).map((_, i) => (
						<Skeleton height={24} key={`line-${i}`} />
					))}
				</Stack>
			) : (
				detail?.line_items &&
				detail.line_items.length > 0 && (
					<>
						<Divider />
						<Text size='xs' fw={600} c='dimmed' tt='uppercase' lts={0.3}>
							Line Items
						</Text>
						<LineItemsTable items={detail.line_items} />
					</>
				)
			)}
		</Stack>
	);
}
