'use client';

import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { formatDate } from '@/shared/lib/utils/dates';
import type { LoanWithRelations } from '../_lib/types';
import { returnLoan } from '../_server/actions';

type Props = {
	loan: LoanWithRelations;
};

export default function ReturnModal({ loan }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const router = useRouter();
	const queryClient = useQueryClient();

	const now = new Date();
	const dueDate = new Date(loan.dueDate);
	const isOverdue = dueDate < now;
	const daysOverdue = isOverdue
		? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
		: 0;
	const fineAmount = daysOverdue * 1;

	const mutation = useMutation({
		mutationFn: () => returnLoan(loan.id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['loans'] });
			notifications.show({
				title: 'Success',
				message: 'Book returned successfully',
				color: 'green',
			});
			close();
			router.refresh();
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
			<Button onClick={open} variant='filled' color='teal'>
				Return Book
			</Button>

			<Modal opened={opened} onClose={close} title='Confirm Return' centered>
				<Stack>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Book
							</Text>
							<Text size='sm' fw={500}>
								{loan.bookCopy.book.title}
							</Text>
						</Group>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Copy
							</Text>
							<Text size='sm'>{loan.bookCopy.serialNumber}</Text>
						</Group>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Borrower
							</Text>
							<Text size='sm'>{loan.student.name}</Text>
						</Group>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Loan Date
							</Text>
							<Text size='sm'>{formatDate(loan.loanDate)}</Text>
						</Group>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Due Date
							</Text>
							<Text size='sm' c={isOverdue ? 'red' : undefined}>
								{formatDate(loan.dueDate)}
							</Text>
						</Group>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Return Date
							</Text>
							<Text size='sm'>{formatDate(now)}</Text>
						</Group>
					</Stack>

					{isOverdue && (
						<Alert
							color='red'
							variant='light'
							icon={<IconAlertTriangle size={16} />}
						>
							<Text size='sm' fw={500}>
								This book is {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}{' '}
								overdue
							</Text>
							<Text size='sm' c='dimmed'>
								Fine: M {fineAmount.toFixed(2)}
							</Text>
						</Alert>
					)}

					<Group justify='flex-end' mt='md'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							color='teal'
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
						>
							Confirm Return
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
