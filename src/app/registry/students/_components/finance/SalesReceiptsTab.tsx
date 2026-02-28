import type {
	ZohoSalesReceipt,
	ZohoSalesReceiptStatus,
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
			renderDetail={(row) => <SalesReceiptDetail receipt={row} />}
		/>
	);
}

type SalesReceiptDetailProps = {
	receipt: ZohoSalesReceipt;
};

function SalesReceiptDetail({ receipt }: SalesReceiptDetailProps) {
	return (
		<Stack gap='md'>
			<SimpleGrid cols={{ base: 2, sm: 4 }} spacing='md'>
				<DetailField
					label='Receipt Date'
					value={formatDate(receipt.date, 'short')}
				/>
				<DetailField label='Payment Mode' value={receipt.payment_mode || '-'} />
				<DetailField
					label='Reference'
					value={receipt.reference_number || '-'}
				/>
				<DetailField
					label='Total'
					value={
						<Text fw={700} ff='monospace' size='sm'>
							{formatCurrency(receipt.total)}
						</Text>
					}
				/>
			</SimpleGrid>

			{receipt.line_items && receipt.line_items.length > 0 && (
				<>
					<Divider />
					<Text size='xs' fw={600} c='dimmed' tt='uppercase' lts={0.3}>
						Line Items
					</Text>
					<LineItemsTable items={receipt.line_items} />
				</>
			)}
		</Stack>
	);
}
