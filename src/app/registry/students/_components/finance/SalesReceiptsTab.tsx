import { fetchSalesReceiptDetail } from '@finance/_lib/zoho-books/actions';
import type {
	ZohoSalesReceipt,
	ZohoSalesReceiptStatus,
} from '@finance/_lib/zoho-books/types';
import { Card, Divider, Group, Skeleton, Stack, Text } from '@mantine/core';
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
					paymentMode={row.payment_mode}
				/>
			)}
		/>
	);
}

type SalesReceiptDetailProps = {
	receiptId: string;
	reference?: string;
	paymentMode?: string;
};

function SalesReceiptDetail({
	receiptId,
	reference,
	paymentMode,
}: SalesReceiptDetailProps) {
	const { data, isLoading } = useQuery({
		queryKey: ['sales-receipt-detail', receiptId],
		queryFn: () => fetchSalesReceiptDetail(receiptId),
		staleTime: 1000 * 60 * 10,
	});

	const currency = data?.currency_code ?? 'LSL';
	const lineItems = data?.line_items ?? [];
	const fmt = (n: number) =>
		n.toLocaleString('en', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

	const mode = paymentMode ?? data?.payment_mode;
	const ref = data?.reference_number ?? reference;

	return (
		<Stack gap='sm'>
			{isLoading ? (
				<Stack gap='xs'>
					<Skeleton height={14} width={120} />
					<Skeleton height={60} />
				</Stack>
			) : lineItems.length > 0 ? (
				<LineItemsTable items={lineItems} />
			) : (
				<Text size='sm' c='dimmed'>
					No line items
				</Text>
			)}
			{data && (
				<Group align='flex-start' justify='space-between'>
					{(mode || ref) && (
						<Card p='sm' withBorder radius='md' w={300}>
							<Stack gap={8}>
								<Text size='xs' fw={700}>
									Payment Details
								</Text>
								{mode && <PaymentField label='Payment Mode' value={mode} />}
								{ref && <PaymentField label='Reference' value={ref} />}
							</Stack>
						</Card>
					)}
					<Stack gap={4} w={300}>
						<SummaryRow
							label='Sub Total'
							value={fmt(data.sub_total ?? data.total)}
						/>
						{!!data.discount_total && (
							<SummaryRow
								label='Discount'
								value={`(-) ${fmt(data.discount_total)}`}
								color='green'
							/>
						)}
						{!!data.tax_total && (
							<SummaryRow label='Tax' value={fmt(data.tax_total)} />
						)}
						<Divider my={4} />
						<SummaryRow
							label='Total'
							value={`${currency}${fmt(data.total)}`}
							bold
						/>
					</Stack>
				</Group>
			)}
		</Stack>
	);
}

type PaymentFieldProps = { label: string; value: string };

function PaymentField({ label, value }: PaymentFieldProps) {
	return (
		<Group gap='xs' wrap='nowrap' align='flex-start'>
			<Text size='xs' c='dimmed' fw={600} w={100} style={{ flexShrink: 0 }}>
				{label}
			</Text>
			<Text size='sm' fw={600}>
				{value}
			</Text>
		</Group>
	);
}

type SummaryRowProps = {
	label: string;
	value: string;
	bold?: boolean;
	color?: string;
};

function SummaryRow({ label, value, bold, color }: SummaryRowProps) {
	return (
		<Group justify='space-between'>
			<Text size='sm' c={bold ? undefined : 'dimmed'} fw={bold ? 600 : 400}>
				{label}
			</Text>
			<Text size='sm' fw={bold ? 700 : 500} ff='monospace' c={color}>
				{value}
			</Text>
		</Group>
	);
}
