'use client';

import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { getFineStatusColor } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import { formatCurrency } from '@/shared/lib/utils/utils';
import type { FineStatus } from '../_lib/types';

type Props = {
	bookTitle: string;
	amount: number;
	daysOverdue: number;
	status: FineStatus;
	paidAt?: Date | null;
};

export default function FineCard({
	bookTitle,
	amount,
	daysOverdue,
	status,
	paidAt,
}: Props) {
	return (
		<Card withBorder p='md'>
			<Stack gap='xs'>
				<Group justify='space-between'>
					<Text fw={500}>{bookTitle}</Text>
					<Badge color={getFineStatusColor(status)} variant='light'>
						{status}
					</Badge>
				</Group>

				<Group justify='space-between'>
					<Text size='sm' c='dimmed'>
						Fine Amount
					</Text>
					<Text fw={600} c={status === 'Unpaid' ? 'red' : undefined}>
						{formatCurrency(amount, 'M')}
					</Text>
				</Group>

				<Group justify='space-between'>
					<Text size='sm' c='dimmed'>
						Days Overdue
					</Text>
					<Text size='sm'>{daysOverdue} days</Text>
				</Group>

				{paidAt && (
					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							Paid On
						</Text>
						<Text size='sm' c='green'>
							{formatDate(paidAt)}
						</Text>
					</Group>
				)}
			</Stack>
		</Card>
	);
}
