'use client';

import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { verifyBankDeposit } from '../_server/actions';

type Props = {
	depositId: string;
	applicantName: string;
};

export default function VerifyDepositModal({
	depositId,
	applicantName,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [receiptNo, setReceiptNo] = useState('');
	const router = useRouter();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => verifyBankDeposit(depositId, receiptNo),
		onSuccess: () => {
			notifications.show({
				title: 'Deposit Verified',
				message: `Payment verified for ${applicantName}`,
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['bank-deposits'] });
			close();
			router.refresh();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Verification Failed',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleSubmit() {
		if (!receiptNo.trim()) {
			notifications.show({
				title: 'Error',
				message: 'Please enter a receipt number',
				color: 'red',
			});
			return;
		}
		mutation.mutate();
	}

	return (
		<>
			<Button
				size='xs'
				color='green'
				leftSection={<IconCheck size={14} />}
				onClick={open}
			>
				Verify
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Verify Bank Deposit'
				centered
			>
				<Stack gap='md'>
					<Text size='sm' c='dimmed'>
						Enter the receipt number to verify this bank deposit for{' '}
						<strong>{applicantName}</strong>.
					</Text>

					<TextInput
						label='Receipt Number'
						placeholder='Enter receipt number'
						value={receiptNo}
						onChange={(e) => setReceiptNo(e.currentTarget.value)}
						required
					/>

					<Button
						fullWidth
						color='green'
						onClick={handleSubmit}
						loading={mutation.isPending}
					>
						Verify & Create Receipt
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
