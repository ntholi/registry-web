'use client';

import type {
	ZohoInvoice,
	ZohoInvoiceStatus,
} from '@finance/_lib/zoho-books/types';
import { Chip, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { statusColors } from '@/shared/lib/utils/colors';
import {
	CurrencyCell,
	DateCell,
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
			<Chip.Group value={filter} onChange={(v) => setFilter(v as Filter)}>
				<Group gap='xs'>
					{FILTERS.map((f) => (
						<Chip key={f.value} value={f.value} size='xs' variant='light'>
							{f.label}
						</Chip>
					))}
				</Group>
			</Chip.Group>
			<TransactionTable
				data={filtered}
				columns={columns}
				rowKey={(r) => r.invoice_id}
				emptyLabel='No invoices found.'
			/>
		</Stack>
	);
}
