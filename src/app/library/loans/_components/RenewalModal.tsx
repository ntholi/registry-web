'use client';

import { Button, Group, Modal, Stack, Table, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconRefresh } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { formatDate } from '@/shared/lib/utils/dates';
import type { LoanWithRelations } from '../_lib/types';
import { renewLoan } from '../_server/actions';

type Props = {
	loan: LoanWithRelations;
};

export default function RenewalModal({ loan }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const router = useRouter();
	const queryClient = useQueryClient();

	const currentDueDate = new Date(loan.dueDate);
	const minDate = new Date(currentDueDate);
	minDate.setDate(minDate.getDate() + 1);

	const [newDueDate, setNewDueDate] = useState<string | null>(null);

	const mutation = useMutation({
		mutationFn: () => {
			if (!newDueDate) throw new Error('Please select a new due date');
			return renewLoan(loan.id, new Date(newDueDate));
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['loans'] });
			notifications.show({
				title: 'Success',
				message: 'Loan renewed successfully',
				color: 'green',
			});
			close();
			setNewDueDate(null);
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
			<Button
				onClick={open}
				variant='default'
				color='blue'
				leftSection={<IconRefresh size={16} />}
			>
				Renew
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Renew Loan'
				centered
				size='md'
			>
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
								Current Due Date
							</Text>
							<Text size='sm'>{formatDate(loan.dueDate)}</Text>
						</Group>
					</Stack>

					{loan.renewals.length > 0 && (
						<Stack gap='xs'>
							<Text size='sm' fw={500}>
								Renewal History
							</Text>
							<Table striped highlightOnHover withTableBorder>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Previous Due</Table.Th>
										<Table.Th>New Due</Table.Th>
										<Table.Th>Renewed On</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{loan.renewals.map((r) => (
										<Table.Tr key={r.id}>
											<Table.Td>{formatDate(r.previousDueDate)}</Table.Td>
											<Table.Td>{formatDate(r.newDueDate)}</Table.Td>
											<Table.Td>{formatDate(r.renewedAt)}</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						</Stack>
					)}

					<DateInput
						label='New Due Date'
						placeholder='Select new due date'
						value={newDueDate}
						onChange={setNewDueDate}
						minDate={minDate}
						firstDayOfWeek={0}
						required
					/>

					<Group justify='flex-end' mt='md'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							color='blue'
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
							disabled={!newDueDate}
						>
							Renew Loan
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
