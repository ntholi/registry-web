import type {
	ZohoSalesReceipt,
	ZohoSalesReceiptStatus,
} from '@finance/_lib/zoho-books/types';
import { Group, Stack } from '@mantine/core';
import { statusColors } from '@/shared/lib/utils/colors';
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
	receipts: ZohoSalesReceipt[];
};

const LABEL_MAP: Record<ZohoSalesReceiptStatus, string> = {
	draft: 'Draft',
	confirmed: 'Confirmed',
	void: 'Void',
};

const columns: TransactionColumn<ZohoSalesReceipt>[] = [
	{
		key: 'date',
		label: 'Date',
		render: (row) => <DateCell date={row.date} />,
	},
	{
		key: 'number',
		label: 'Receipt #',
		render: (row) => <NumberCell value={row.salesreceipt_number} />,
	},
	{
		key: 'total',
		label: 'Amount',
		align: 'right',
		render: (row) => <CurrencyCell amount={row.total} />,
	},
	{
		key: 'status',
		label: 'Status',
		align: 'center',
		render: (row) => (
			<StatusBadge
				status={row.status}
				colorMap={statusColors.salesReceiptStatus}
				labelMap={LABEL_MAP}
			/>
		),
	},
];

export function SalesReceiptsTab({ receipts }: Props) {
	return (
		<TransactionTable
			data={receipts}
			columns={columns}
			rowKey={(r) => r.salesreceipt_id}
			emptyLabel='No sales receipts found.'
			renderDetail={(row) => <SalesReceiptDetail receipt={row} />}
		/>
	);
}

type SalesReceiptDetailProps = {
	receipt: ZohoSalesReceipt;
};

function SalesReceiptDetail({ receipt }: SalesReceiptDetailProps) {
	return (
		<Stack gap='sm'>
			<Group gap='xl'>
				<DetailField label='Payment Mode' value={receipt.payment_mode || '-'} />
				<DetailField
					label='Reference'
					value={receipt.reference_number || '-'}
				/>
			</Group>

			{receipt.line_items && receipt.line_items.length > 0 && (
				<LineItemsTable items={receipt.line_items} />
			)}
		</Stack>
	);
}
