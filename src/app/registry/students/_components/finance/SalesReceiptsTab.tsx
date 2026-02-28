import type {
	ZohoSalesReceipt,
	ZohoSalesReceiptStatus,
} from '@finance/_lib/zoho-books/types';
import { Text } from '@mantine/core';
import { statusColors } from '@/shared/lib/utils/colors';
import {
	CurrencyCell,
	DateCell,
	NumberCell,
	RefCell,
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
		key: 'ref',
		label: 'Reference',
		render: (row) => <RefCell value={row.reference_number} />,
	},
	{
		key: 'mode',
		label: 'Payment Mode',
		render: (row) => <Text size='sm'>{row.payment_mode || '-'}</Text>,
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
		/>
	);
}
