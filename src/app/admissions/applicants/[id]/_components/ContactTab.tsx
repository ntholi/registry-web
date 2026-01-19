'use client';

import {
	ActionIcon,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhone, IconTrash } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { removeApplicantPhone } from '../../_server/actions';

type Phone = {
	id: string;
	phoneNumber: string;
};

type Props = {
	phones: Phone[];
};

export default function ContactTab({ phones }: Props) {
	const router = useRouter();

	const removeMutation = useMutation({
		mutationFn: removeApplicantPhone,
		onSuccess: () => {
			router.refresh();
			notifications.show({
				title: 'Success',
				message: 'Phone number removed',
				color: 'green',
			});
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
		<Stack gap='md'>
			{phones.length > 0 ? (
				<SimpleGrid cols={{ base: 1, sm: 3 }}>
					{phones.map((phone) => (
						<Paper key={phone.id} p='md' radius='md' withBorder>
							<Group justify='space-between'>
								<Group gap='sm'>
									<IconPhone size={18} opacity={0.6} />
									<Text size='sm' fw={500}>
										{phone.phoneNumber}
									</Text>
								</Group>
								<ActionIcon
									color='red'
									variant='subtle'
									onClick={() => removeMutation.mutate(phone.id)}
									loading={removeMutation.isPending}
								>
									<IconTrash size={16} />
								</ActionIcon>
							</Group>
						</Paper>
					))}
				</SimpleGrid>
			) : (
				<Paper p='xl' radius='md' withBorder>
					<Stack align='center' gap='xs'>
						<IconPhone size={32} opacity={0.3} />
						<Text size='sm' c='dimmed'>
							No phone numbers added
						</Text>
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
