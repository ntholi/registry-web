'use client';

import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { PaymentWithRelations } from '../_lib/types';
import { markPaymentAsPaid } from '../_server/actions';

type Props = {
	payment: PaymentWithRelations;
};

export default function MarkAsPaidModal({ payment }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [reference, setReference] = useState('');
	const router = useRouter();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => markPaymentAsPaid(payment.id, reference),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['payments'] });
			notifications.show({
				title: 'Success',
				message: 'Payment marked as paid',
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

	function handleSubmit() {
		if (!reference.trim()) {
			notifications.show({
				title: 'Error',
				message: 'Reference number is required',
				color: 'red',
			});
			return;
		}
		mutation.mutate();
	}

	if (payment.status === 'success') {
		return null;
	}

	return (
		<>
			<Button
				onClick={open}
				variant='filled'
				color='green'
				leftSection={<IconCheck size={16} />}
			>
				Mark as Paid
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Mark Payment as Paid'
				centered
			>
				<Stack>
					<Text size='sm' c='dimmed'>
						Manually mark this payment as paid. This should only be used for
						payments made via bank transfer or cash.
					</Text>

					{payment.application?.applicant && (
						<Stack gap='xs'>
							<Text size='sm' c='dimmed'>
								Applicant
							</Text>
							<Text size='sm' fw={500}>
								{payment.application.applicant.fullName}
							</Text>
						</Stack>
					)}

					<Stack gap='xs'>
						<Text size='sm' c='dimmed'>
							Amount
						</Text>
						<Text size='sm' fw={500}>
							M {payment.amount}
						</Text>
					</Stack>

					<TextInput
						label='Reference Number'
						placeholder='Enter bank reference or receipt number'
						value={reference}
						onChange={(e) => setReference(e.currentTarget.value)}
						required
					/>

					<Button
						onClick={handleSubmit}
						loading={mutation.isPending}
						color='green'
						fullWidth
						mt='md'
					>
						Confirm Payment
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
