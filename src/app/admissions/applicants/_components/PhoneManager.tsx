'use client';

import {
	ActionIcon,
	Button,
	Group,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { addApplicantPhone, removeApplicantPhone } from '../_server/actions';

type Phone = {
	id: number;
	phoneNumber: string;
};

type Props = {
	applicantId: string;
	phones: Phone[];
};

export default function PhoneManager({ applicantId, phones }: Props) {
	const queryClient = useQueryClient();
	const [isAdding, setIsAdding] = useState(false);
	const form = useForm({ initialValues: { phoneNumber: '' } });

	const addMutation = useMutation({
		mutationFn: (phoneNumber: string) =>
			addApplicantPhone(applicantId, phoneNumber),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			form.reset();
			setIsAdding(false);
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
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
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

			{isAdding ? (
				<form
					onSubmit={form.onSubmit((values) =>
						addMutation.mutate(values.phoneNumber)
					)}
				>
					<Group>
						<TextInput
							placeholder='Enter phone number'
							{...form.getInputProps('phoneNumber')}
							style={{ flex: 1 }}
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
			) : (
				<Button
					variant='light'
					leftSection={<IconPlus size={16} />}
					onClick={() => setIsAdding(true)}
					size='sm'
				>
					Add Phone Number
				</Button>
			)}
		</Stack>
	);
}
