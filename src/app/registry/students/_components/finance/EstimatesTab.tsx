import type {
	ZohoEstimate,
	ZohoEstimateStatus,
} from '@finance/_lib/zoho-books/types';
import { Divider, SimpleGrid, Stack, Text } from '@mantine/core';
import { statusColors } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import { formatCurrency } from '@/shared/lib/utils/utils';
import {
	CurrencyCell,
	DateCell,
	DetailField,
	LineItemsTable,
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
			renderDetail={(row) => <EstimateDetail estimate={row} />}
		/>
	);
}

type EstimateDetailProps = {
	estimate: ZohoEstimate;
};

function EstimateDetail({ estimate }: EstimateDetailProps) {
	return (
		<Stack gap='md'>
			<SimpleGrid cols={{ base: 2, sm: 4 }} spacing='md'>
				<DetailField
					label='Quote Date'
					value={formatDate(estimate.date, 'short')}
				/>
				<DetailField
					label='Expiry Date'
					value={
						estimate.expiry_date
							? formatDate(estimate.expiry_date, 'short')
							: '-'
					}
				/>
				<DetailField
					label='Reference'
					value={estimate.reference_number || '-'}
				/>
				<DetailField
					label='Total'
					value={
						<Text fw={700} ff='monospace' size='sm'>
							{formatCurrency(estimate.total)}
						</Text>
					}
				/>
			</SimpleGrid>

			{estimate.line_items && estimate.line_items.length > 0 && (
				<>
					<Divider />
					<Text size='xs' fw={600} c='dimmed' tt='uppercase' lts={0.3}>
						Line Items
					</Text>
					<LineItemsTable items={estimate.line_items} />
				</>
			)}
		</Stack>
	);
}
