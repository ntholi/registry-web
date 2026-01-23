'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { addPhone, removePhone } from '../_server/actions';

type Phone = {
	id: string;
	phoneNumber: string;
};

type Props = {
	applicantId: string;
	phones: Phone[];
};

export default function PhoneManager({ applicantId, phones }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const form = useForm({
		initialValues: { phoneNumber: '' },
		validate: {
			phoneNumber: (value) => (value ? null : 'Phone number is required'),
		},
	});

	const addMutation = useMutation({
		mutationFn: (phoneNumber: string) => addPhone(applicantId, phoneNumber),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			router.refresh();
			form.reset();
			close();
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
		mutationFn: removePhone,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
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
		<Stack gap='sm'>
			{phones.length > 0 ? (
				<Table>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Phone Number</Table.Th>
							<Table.Th w={60} />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{phones.map((phone) => (
							<Table.Tr key={phone.id}>
								<Table.Td>{phone.phoneNumber}</Table.Td>
								<Table.Td>
									<ActionIcon
										color='red'
										variant='subtle'
										onClick={() => removeMutation.mutate(phone.id)}
										loading={removeMutation.isPending}
									>
										<IconTrash size={16} />
									</ActionIcon>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			) : (
				<Text size='sm' c='dimmed'>
					No phone numbers added
				</Text>
			)}

			<Button
				variant='light'
				leftSection={<IconPlus size={16} />}
				onClick={open}
				size='sm'
			>
				Add Phone Number
			</Button>

			<Modal opened={opened} onClose={close} title='Add Phone Number' centered>
				<form
					onSubmit={form.onSubmit((values) =>
						addMutation.mutate(values.phoneNumber)
					)}
				>
					<Stack gap='md'>
						<TextInput
							label='Phone Number'
							placeholder='Enter phone number'
							required
							{...form.getInputProps('phoneNumber')}
						/>
						<Group justify='flex-end'>
							<Button variant='subtle' onClick={close}>
								Cancel
							</Button>
							<Button type='submit' loading={addMutation.isPending}>
								Add
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</Stack>
	);
}
