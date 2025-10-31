import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import type { getGraduationRequest } from '@/server/graduation/requests/actions';

interface Props {
	value: NonNullable<Awaited<ReturnType<typeof getGraduationRequest>>>;
}

export default function PaymentReceiptsView({ value }: Props) {
	if (!value.paymentReceipts || value.paymentReceipts.length === 0) {
		return (
			<Card>
				<Text c='dimmed'>No payment receipts found</Text>
			</Card>
		);
	}

	return (
		<Stack gap='md'>
			<Title order={4}>Payment Receipts</Title>
			{value.paymentReceipts.map((receipt) => (
				<Card key={receipt.id} withBorder>
					<Group justify='space-between'>
						<Stack gap='xs'>
							<Text fw={500}>{receipt.receiptNo}</Text>
							<Badge variant='light' color='blue'>
								{receipt.paymentType.replace('_', ' ').toUpperCase()}
							</Badge>
						</Stack>
						<Text c='dimmed' size='sm'>
							{receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString() : 'N/A'}
						</Text>
					</Group>
				</Card>
			))}
		</Stack>
	);
}
