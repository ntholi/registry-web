import { fetchSalesReceiptDetail } from '@finance/_lib/zoho-books/actions';
import type {
	ZohoSalesReceipt,
	ZohoSalesReceiptStatus,
} from '@finance/_lib/zoho-books/types';
import { Skeleton, Stack, Text } from '@mantine/core';
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
		key: 'reference',
		label: 'Reference',
		render: (row) => <RefCell value={row.reference_number} />,
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
				<SalesReceiptDetail receiptId={row.sales_receipt_id} />
			)}
		/>
	);
}

type SalesReceiptDetailProps = {
	receiptId: string;
};

function SalesReceiptDetail({ receiptId }: SalesReceiptDetailProps) {
	const { data, isLoading } = useQuery({
		queryKey: ['sales-receipt-detail', receiptId],
		queryFn: () => fetchSalesReceiptDetail(receiptId),
		staleTime: 1000 * 60 * 10,
	});

	if (isLoading) {
		return (
			<Stack gap='xs'>
				<Skeleton height={14} width={120} />
				<Skeleton height={60} />
			</Stack>
		);
	}

	if (!data?.line_items || data.line_items.length === 0) {
		return (
			<Text size='sm' c='dimmed'>
				No line items
			</Text>
		);
	}

	return <LineItemsTable items={data.line_items} />;
}
