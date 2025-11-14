'use client';

import { Badge, Flex, Stack, Table, Text, Title } from '@mantine/core';
import type { getGraduationRequest } from '../../clearance/server/requests/actions';

interface Props {
	value: NonNullable<Awaited<ReturnType<typeof getGraduationRequest>>>;
}

export default function PaymentReceiptsView({ value }: Props) {
	const { paymentReceipts } = value;

	if (!paymentReceipts || paymentReceipts.length === 0) {
		return (
			<Stack>
				<Title order={4}>Payment Receipts</Title>
				<Text c='dimmed' size='sm'>
					No payment receipts found
				</Text>
			</Stack>
		);
	}

	const rows = paymentReceipts.map((receipt) => (
		<Table.Tr key={receipt.id}>
			<Table.Td fw={500}>{receipt.receiptNo}</Table.Td>
			<Table.Td>
				<Badge variant='light' color='blue'>
					{receipt.paymentType.replace('_', ' ').toUpperCase()}
				</Badge>
			</Table.Td>
			<Table.Td>
				{receipt.createdAt
					? new Date(receipt.createdAt).toLocaleDateString()
					: 'N/A'}
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Stack>
			<Flex justify='space-between' align='center'>
				<Title order={4}>Payment Receipts</Title>
				<Text c='dimmed' size='sm'>
					{paymentReceipts.length}{' '}
					{paymentReceipts.length === 1 ? 'Receipt' : 'Receipts'}
				</Text>
			</Flex>

			<Table highlightOnHover withTableBorder>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Receipt Number</Table.Th>
						<Table.Th>Payment Type</Table.Th>
						<Table.Th>Date</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
		</Stack>
	);
}
