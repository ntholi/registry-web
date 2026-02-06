'use client';

import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { rejectBankDeposit } from '../_server/actions';

type Props = {
	depositId: string;
	applicantName: string;
};

export default function RejectDepositModal({
	depositId,
	applicantName,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const router = useRouter();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => rejectBankDeposit(depositId),
		onSuccess: () => {
			notifications.show({
				title: 'Deposit Rejected',
				message: `Payment rejected and application cancelled for ${applicantName}`,
				color: 'orange',
			});
			queryClient.invalidateQueries({ queryKey: ['bank-deposits'] });
			close();
			router.push('/admissions/payments');
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Rejection Failed',
				message: error.message,
				color: 'red',
			});
		},
	});

	return (
		<>
			<Button
				size='xs'
				color='red'
				variant='light'
				leftSection={<IconX size={14} />}
				onClick={open}
			>
				Reject
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Reject Bank Deposit'
				centered
			>
				<Stack gap='md'>
					<Text size='sm' c='dimmed'>
						Are you sure you want to reject this bank deposit? This will also{' '}
						<strong>cancel the application</strong> for {applicantName}.
					</Text>

					<Group justify='flex-end'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							color='red'
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
						>
							Reject & Cancel Application
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
