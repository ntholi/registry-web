import type {
	ZohoEstimate,
	ZohoEstimateStatus,
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
	estimates: ZohoEstimate[];
};

const LABEL_MAP: Record<ZohoEstimateStatus, string> = {
	draft: 'Draft',
	sent: 'Sent',
	invoiced: 'Invoiced',
	accepted: 'Accepted',
	declined: 'Declined',
	expired: 'Expired',
};

const columns: TransactionColumn<ZohoEstimate>[] = [
	{
		key: 'date',
		label: 'Date',
		render: (row) => <DateCell date={row.date} />,
	},
	{
		key: 'number',
		label: 'Quote #',
		render: (row) => <NumberCell value={row.estimate_number} />,
	},
	{
		key: 'ref',
		label: 'Reference',
		render: (row) => <RefCell value={row.reference_number} />,
	},
	{
		key: 'expiry',
		label: 'Expiry Date',
		render: (row) => (
			<Text size='sm' c='dimmed'>
				{row.expiry_date ? <DateCell date={row.expiry_date} /> : '-'}
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
		key: 'status',
		label: 'Status',
		align: 'center',
		render: (row) => (
			<StatusBadge
				status={row.status}
				colorMap={statusColors.estimateStatus}
				labelMap={LABEL_MAP}
			/>
		),
	},
];

export function EstimatesTab({ estimates }: Props) {
	return (
		<TransactionTable
			data={estimates}
			columns={columns}
			rowKey={(r) => r.estimate_id}
			emptyLabel='No quotes found.'
		/>
	);
}
