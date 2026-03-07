import { fetchSalesReceiptDetail } from '@finance/_lib/zoho-books/actions';
import type {
	ZohoSalesReceipt,
	ZohoSalesReceiptStatus,
} from '@finance/_lib/zoho-books/types';
import { Card, Group, Skeleton, Stack, Text } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { statusColors } from '@/shared/lib/utils/colors';
import {
	CurrencyCell,
	DateCell,
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
	paid: 'Paid',
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
		render: (row) => <NumberCell value={row.receipt_number} />,
	},
	{
		key: 'payment_mode',
		label: 'Payment Mode',
		render: (row) => <RefCell value={row.payment_mode} />,
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
			rowKey={(r) => r.sales_receipt_id}
			emptyLabel='No sales receipts found.'
			renderDetail={(row) => (
				<SalesReceiptDetail
					receiptId={row.sales_receipt_id}
					reference={row.reference_number}
				/>
			)}
		/>
	);
}

type SalesReceiptDetailProps = {
	receiptId: string;
	reference?: string;
};

function SalesReceiptDetail({ receiptId, reference }: SalesReceiptDetailProps) {
	const { data, isLoading } = useQuery({
		queryKey: ['sales-receipt-detail', receiptId],
		queryFn: () => fetchSalesReceiptDetail(receiptId),
		staleTime: 1000 * 60 * 10,
	});

	return (
		<Stack gap='sm'>
			{isLoading ? (
				<Stack gap='xs'>
					<Skeleton height={14} width={120} />
					<Skeleton height={60} />
				</Stack>
			) : data?.line_items && data.line_items.length > 0 ? (
				<LineItemsTable items={data.line_items} />
			) : (
				<Text size='sm' c='dimmed'>
					No line items
				</Text>
			)}
			{reference && (
				<Card p='xs' px='sm' withBorder>
					<Group gap='xs'>
						<IconUser size='0.85rem' opacity={0.5} />
						<Text size='xs' c='dimmed' fw={600} tt='uppercase' lts={0.3}>
							Reference:
						</Text>
						<Text size='sm' fw={500}>
							{reference}
						</Text>
					</Group>
				</Card>
			)}
		</Stack>
	);
}
