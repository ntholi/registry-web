import type { ZohoPayment } from '@finance/_lib/zoho-books/types';
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
	payments: ZohoPayment[];
};

const LABEL_MAP: Record<string, string> = {
	'': 'Paid',
	void: 'Void',
};

const columns: TransactionColumn<ZohoPayment>[] = [
	{
		key: 'date',
		label: 'Date',
		render: (row) => <DateCell date={row.date} />,
	},
	{
		key: 'number',
		label: 'Payment #',
		render: (row) => <NumberCell value={row.payment_number} />,
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
		key: 'amount',
		label: 'Amount',
		align: 'right',
		render: (row) => <CurrencyCell amount={row.amount} color='green' />,
	},
	{
		key: 'unused',
		label: 'Unused Amount',
		align: 'right',
		render: (row) => <CurrencyCell amount={row.unused_amount} />,
	},
	{
		key: 'status',
		label: 'Status',
		align: 'center',
		render: (row) => (
			<StatusBadge
				status={row.status}
				colorMap={statusColors.zohoPaymentStatus}
				labelMap={LABEL_MAP}
			/>
		),
	},
];

export function PaymentsTab({ payments }: Props) {
	return (
		<TransactionTable
			data={payments}
			columns={columns}
			rowKey={(r) => r.payment_id}
			emptyLabel='No payments received.'
		/>
	);
}
