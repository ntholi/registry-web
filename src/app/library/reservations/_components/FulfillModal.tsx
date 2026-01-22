'use client';

import { Button, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { fulfillReservation } from '../_server/actions';

type Props = {
	reservation: {
		id: string;
		book: {
			title: string;
		};
		student: {
			name: string;
		};
	};
};

export default function FulfillModal({ reservation }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const router = useRouter();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => fulfillReservation(reservation.id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['reservations'] });
			notifications.show({
				title: 'Success',
				message: 'Reservation fulfilled successfully',
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
				color='green'
				variant='light'
				leftSection={<IconCheck size={16} />}
				onClick={open}
			>
				Fulfill
			</Button>

			<Modal opened={opened} onClose={close} title='Fulfill Reservation'>
				<Stack gap='md'>
					<Text>
						Mark this reservation as fulfilled for{' '}
						<Text span fw={500}>
							{reservation.student.name}
						</Text>
						?
					</Text>
					<Text size='sm' c='dimmed'>
						Book: {reservation.book.title}
					</Text>

					<Button
						fullWidth
						color='green'
						loading={mutation.isPending}
						onClick={() => mutation.mutate()}
					>
						Confirm Fulfillment
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
