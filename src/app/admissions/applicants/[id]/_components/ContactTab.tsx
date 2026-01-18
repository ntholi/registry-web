'use client';

import {
	ActionIcon,
	Button,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPhone, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { addApplicantPhone, removeApplicantPhone } from '../../_server/actions';

type Phone = {
	id: number;
	phoneNumber: string;
};

type Props = {
	applicantId: string;
	phones: Phone[];
};

export default function ContactTab({ applicantId, phones }: Props) {
	const router = useRouter();
	const [isAdding, setIsAdding] = useState(false);
	const form = useForm({ initialValues: { phoneNumber: '' } });

	const addMutation = useMutation({
		mutationFn: (phoneNumber: string) =>
			addApplicantPhone(applicantId, phoneNumber),
		onSuccess: () => {
			form.reset();
			setIsAdding(false);
			router.refresh();
			notifications.show({
				title: 'Success',
				message: 'Phone number added',
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

			{isAdding ? (
				<Paper p='md' radius='md' withBorder>
					<form
						onSubmit={form.onSubmit((values) =>
							addMutation.mutate(values.phoneNumber)
						)}
					>
						<Group>
							<TextInput
								placeholder='Enter phone number'
								{...form.getInputProps('phoneNumber')}
								flex={1}
							/>
							<Button type='submit' size='sm' loading={addMutation.isPending}>
								Add
							</Button>
							<Button
								variant='subtle'
								size='sm'
								onClick={() => {
									setIsAdding(false);
									form.reset();
								}}
							>
								Cancel
							</Button>
						</Group>
					</form>
				</Paper>
			) : (
				<Button
					variant='light'
					leftSection={<IconPlus size={16} />}
					onClick={() => setIsAdding(true)}
				>
					Add Phone Number
				</Button>
			)}
		</Stack>
	);
}
