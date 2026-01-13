'use client';

import { Badge, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/shared/lib/utils/utils';
import type { FineWithRelations } from '../_lib/types';
import { payFine } from '../_server/actions';

type Props = {
	fine: FineWithRelations;
};

export default function PaymentModal({ fine }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => payFine(fine.id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['fines'] });
			notifications.show({
				title: 'Payment Recorded',
				message: 'Fine payment has been recorded successfully',
				color: 'green',
			});
			close();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	return (
		<>
			<Button
				leftSection={<IconCash size={16} />}
				onClick={open}
				disabled={fine.status === 'Paid'}
			>
				Record Payment
			</Button>

			<Modal opened={opened} onClose={close} title='Record Fine Payment'>
				<Stack>
					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							Book
						</Text>
						<Text fw={500}>{fine.loan.bookCopy.book.title}</Text>
					</Group>

					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							Student
						</Text>
						<Text fw={500}>
							{fine.student.stdNo} - {fine.student.name}
						</Text>
					</Group>

					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							Days Overdue
						</Text>
						<Badge color='red' variant='light'>
							{fine.daysOverdue} days
						</Badge>
					</Group>

					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							Fine Amount
						</Text>
						<Text fw={700} size='lg' c='red'>
							{formatCurrency(fine.amount, 'M')}
						</Text>
					</Group>

					<Group justify='flex-end' mt='md'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
							color='green'
						>
							Confirm Payment
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
