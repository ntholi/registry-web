import type { ZohoPayment } from '@finance/_lib/zoho-books/types';
import { Group, Stack, Table, Text } from '@mantine/core';
import { statusColors } from '@/shared/lib/utils/colors';
import { formatCurrency } from '@/shared/lib/utils/utils';
import {
	CurrencyCell,
	DateCell,
	DetailField,
	NumberCell,
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
			renderDetail={(row) => <PaymentDetail payment={row} />}
		/>
	);
}

type PaymentDetailProps = {
	payment: ZohoPayment;
};

function PaymentDetail({ payment }: PaymentDetailProps) {
	return (
		<Stack gap='sm'>
			<Group gap='xl'>
				<DetailField label='Payment Mode' value={payment.payment_mode || '-'} />
				<DetailField
					label='Reference'
					value={payment.reference_number || '-'}
				/>
				{payment.description && (
					<DetailField label='Description' value={payment.description} />
				)}
			</Group>

			{payment.invoices && payment.invoices.length > 0 && (
				<Table verticalSpacing={4} horizontalSpacing='sm' fz='xs'>
					<Table.Thead>
						<Table.Tr>
							<Table.Th fw={600} c='dimmed' tt='uppercase' lts={0.3}>
								Invoice #
							</Table.Th>
							<Table.Th fw={600} c='dimmed' tt='uppercase' lts={0.3} ta='right'>
								Amount Applied
							</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{payment.invoices.map((inv) => (
							<Table.Tr key={inv.invoice_id}>
								<Table.Td>
									<Text size='xs' fw={500}>
										{inv.invoice_number}
									</Text>
								</Table.Td>
								<Table.Td ta='right'>
									<Text size='xs' fw={600} ff='monospace' c='green'>
										{formatCurrency(inv.amount_applied)}
									</Text>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</Stack>
	);
}
