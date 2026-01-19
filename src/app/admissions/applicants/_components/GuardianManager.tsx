'use client';

import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
	addGuardianPhone,
	createGuardian,
	deleteGuardian,
	removeGuardianPhone,
	updateGuardian,
} from '../_server/actions';

type GuardianPhone = {
	id: string;
	phoneNumber: string;
};

type Guardian = {
	id: string;
	name: string;
	relationship: string;
	address: string | null;
	occupation: string | null;
	companyName: string | null;
	phones: GuardianPhone[];
};

type Props = {
	applicantId: string;
	guardians: Guardian[];
};

const relationshipOptions = [
	{ value: 'Father', label: 'Father' },
	{ value: 'Mother', label: 'Mother' },
	{ value: 'Guardian', label: 'Guardian' },
	{ value: 'Sponsor', label: 'Sponsor' },
	{ value: 'Other', label: 'Other' },
];

export default function GuardianManager({ applicantId, guardians }: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
	const [addingPhoneFor, setAddingPhoneFor] = useState<string | null>(null);
	const [newPhone, setNewPhone] = useState('');

	const form = useForm({
		initialValues: {
			name: '',
			relationship: '',
			address: '',
			occupation: '',
			companyName: '',
		},
	});

	const createMutation = useMutation({
		mutationFn: (data: typeof form.values) =>
			createGuardian({ ...data, applicantId }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			form.reset();
			close();
			notifications.show({
				title: 'Success',
				message: 'Guardian added',
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

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: typeof form.values }) =>
			updateGuardian(id, data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			form.reset();
			setEditingGuardian(null);
			close();
			notifications.show({
				title: 'Success',
				message: 'Guardian updated',
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

	const deleteMutation = useMutation({
		mutationFn: deleteGuardian,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			notifications.show({
				title: 'Success',
				message: 'Guardian deleted',
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

	const addPhoneMutation = useMutation({
		mutationFn: ({
			guardianId,
			phone,
		}: {
			guardianId: string;
			phone: string;
		}) => addGuardianPhone(guardianId, phone),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			setAddingPhoneFor(null);
			setNewPhone('');
			notifications.show({
				title: 'Success',
				message: 'Phone added',
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

	const removePhoneMutation = useMutation({
		mutationFn: removeGuardianPhone,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			notifications.show({
				title: 'Success',
				message: 'Phone removed',
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

	function handleEdit(guardian: Guardian) {
		setEditingGuardian(guardian);
		form.setValues({
			name: guardian.name,
			relationship: guardian.relationship,
			address: guardian.address || '',
			occupation: guardian.occupation || '',
			companyName: guardian.companyName || '',
		});
		open();
	}

	function handleSubmit(values: typeof form.values) {
		if (editingGuardian) {
			updateMutation.mutate({ id: editingGuardian.id, data: values });
		} else {
			createMutation.mutate(values);
		}
	}

	function handleClose() {
		form.reset();
		setEditingGuardian(null);
		close();
	}

	return (
		<Stack gap='md'>
			{guardians.length > 0 ? (
				guardians.map((guardian) => (
					<Card key={guardian.id} withBorder padding='sm'>
						<Group justify='space-between' mb='xs'>
							<Group gap='xs'>
								<Text fw={500}>{guardian.name}</Text>
								<Badge variant='light' size='sm'>
									{guardian.relationship}
								</Badge>
							</Group>
							<Group gap='xs'>
								<ActionIcon
									variant='subtle'
									onClick={() => handleEdit(guardian)}
								>
									<IconEdit size={16} />
								</ActionIcon>
								<ActionIcon
									variant='subtle'
									color='red'
									onClick={() => deleteMutation.mutate(guardian.id)}
									loading={deleteMutation.isPending}
								>
									<IconTrash size={16} />
								</ActionIcon>
							</Group>
						</Group>

						{guardian.occupation && (
							<Text size='sm' c='dimmed'>
								{guardian.occupation}
								{guardian.companyName && ` at ${guardian.companyName}`}
							</Text>
						)}
						{guardian.address && (
							<Text size='sm' c='dimmed'>
								{guardian.address}
							</Text>
						)}

						<Stack gap='xs' mt='sm'>
							<Text size='sm' fw={500}>
								Phone Numbers
							</Text>
							{guardian.phones.length > 0 ? (
								<Group gap='xs'>
									{guardian.phones.map((phone) => (
										<Badge
											key={phone.id}
											variant='outline'
											rightSection={
												<ActionIcon
													size='xs'
													variant='transparent'
													color='red'
													onClick={() => removePhoneMutation.mutate(phone.id)}
												>
													<IconTrash size={12} />
												</ActionIcon>
											}
										>
											{phone.phoneNumber}
										</Badge>
									))}
								</Group>
							) : (
								<Text size='sm' c='dimmed'>
									No phone numbers
								</Text>
							)}

							{addingPhoneFor === guardian.id ? (
								<Group gap='xs'>
									<TextInput
										size='xs'
										placeholder='Phone number'
										value={newPhone}
										onChange={(e) => setNewPhone(e.target.value)}
									/>
									<Button
										size='xs'
										onClick={() =>
											addPhoneMutation.mutate({
												guardianId: guardian.id,
												phone: newPhone,
											})
										}
										loading={addPhoneMutation.isPending}
									>
										Add
									</Button>
									<Button
										size='xs'
										variant='subtle'
										onClick={() => {
											setAddingPhoneFor(null);
											setNewPhone('');
										}}
									>
										Cancel
									</Button>
								</Group>
							) : (
								<Button
									size='xs'
									variant='light'
									leftSection={<IconPlus size={14} />}
									onClick={() => setAddingPhoneFor(guardian.id)}
								>
									Add Phone
								</Button>
							)}
						</Stack>
					</Card>
				))
			) : (
				<Text size='sm' c='dimmed'>
					No guardians added
				</Text>
			)}

			<Button
				variant='light'
				leftSection={<IconPlus size={16} />}
				onClick={open}
			>
				Add Guardian
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title={editingGuardian ? 'Edit Guardian' : 'Add Guardian'}
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack gap='sm'>
						<TextInput label='Name' required {...form.getInputProps('name')} />
						<Select
							label='Relationship'
							required
							data={relationshipOptions}
							{...form.getInputProps('relationship')}
						/>
						<TextInput
							label='Occupation'
							{...form.getInputProps('occupation')}
						/>
						<TextInput
							label='Company Name'
							{...form.getInputProps('companyName')}
						/>
						<Textarea
							label='Address'
							rows={2}
							{...form.getInputProps('address')}
						/>
						<Group justify='flex-end'>
							<Button variant='subtle' onClick={handleClose}>
								Cancel
							</Button>
							<Button
								type='submit'
								loading={createMutation.isPending || updateMutation.isPending}
							>
								{editingGuardian ? 'Update' : 'Add'}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</Stack>
	);
}
