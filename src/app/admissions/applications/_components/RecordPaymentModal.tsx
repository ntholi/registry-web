'use client';

import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { recordApplicationPayment } from '../_server/actions';

type Props = {
	applicationId: number;
};

export default function RecordPaymentModal({ applicationId }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [receiptId, setReceiptId] = useState('');
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async () => {
			if (!receiptId.trim()) throw new Error('Receipt ID is required');
			return recordApplicationPayment(applicationId, receiptId.trim());
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applications'] });
			notifications.show({
				title: 'Success',
				message: 'Payment recorded successfully',
				color: 'green',
			});
			close();
			setReceiptId('');
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleClose() {
		setReceiptId('');
		close();
	}

	return (
		<>
			<Button
				variant='light'
				color='green'
				leftSection={<IconCash size={16} />}
				onClick={open}
			>
				Record Payment
			</Button>

			<Modal opened={opened} onClose={handleClose} title='Record Payment'>
				<Stack>
					<TextInput
						label='Receipt ID'
						placeholder='Enter receipt ID to link'
						value={receiptId}
						onChange={(e) => setReceiptId(e.target.value)}
						required
					/>

					<Group justify='flex-end'>
						<Button variant='subtle' onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
							disabled={!receiptId.trim()}
						>
							Record Payment
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
