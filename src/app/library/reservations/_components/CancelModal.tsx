'use client';

import { Button, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { cancelReservation } from '../_server/actions';

type Props = {
	reservation: {
		id: string;
		book: {
			title: string;
		};
	};
};

export default function CancelModal({ reservation }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const router = useRouter();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => cancelReservation(reservation.id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['reservations'] });
			notifications.show({
				title: 'Success',
				message: 'Reservation cancelled successfully',
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
			<Button
				size='xs'
				color='red'
				variant='light'
				leftSection={<IconX size={16} />}
				onClick={open}
			>
				Cancel
			</Button>

			<Modal opened={opened} onClose={close} title='Cancel Reservation'>
				<Stack gap='md'>
					<Text>
						Are you sure you want to cancel this reservation for{' '}
						<Text span fw={500}>
							{reservation.book.title}
						</Text>
						?
					</Text>

					<Button
						fullWidth
						color='red'
						loading={mutation.isPending}
						onClick={() => mutation.mutate()}
					>
						Confirm Cancellation
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
