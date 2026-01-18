'use client';

import {
	ActionIcon,
	Avatar,
	Badge,
	Button,
	Group,
	Modal,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash, IconUser } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import {
	addGuardianPhone,
	deleteGuardian,
	removeGuardianPhone,
	updateGuardian,
} from '../../_server/actions';

type GuardianPhone = {
	id: number;
	phoneNumber: string;
};

type Guardian = {
	id: number;
	name: string;
	relationship: string;
	address: string | null;
	occupation: string | null;
	companyName: string | null;
	phones: GuardianPhone[];
};

type Props = {
	guardians: Guardian[];
};

const relationshipOptions = [
	{ value: 'Father', label: 'Father' },
	{ value: 'Mother', label: 'Mother' },
	{ value: 'Guardian', label: 'Guardian' },
	{ value: 'Sponsor', label: 'Sponsor' },
	{ value: 'Other', label: 'Other' },
];

export default function GuardiansTab({ guardians }: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
	const [addingPhoneFor, setAddingPhoneFor] = useState<number | null>(null);
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

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: typeof form.values }) =>
			updateGuardian(id, data),
		onSuccess: () => {
			form.reset();
			setEditingGuardian(null);
			close();
			router.refresh();
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
		onSuccess: () => {
			router.refresh();
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
			guardianId: number;
			phone: string;
		}) => addGuardianPhone(guardianId, phone),
		onSuccess: () => {
			setAddingPhoneFor(null);
			setNewPhone('');
			router.refresh();
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
		onSuccess: () => {
			router.refresh();
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
				<SimpleGrid cols={{ base: 1, md: 2 }} spacing='md'>
					{guardians.map((guardian) => (
						<Paper key={guardian.id} p='lg' radius='md' withBorder>
							<Stack gap='md'>
								<Group justify='space-between'>
									<Group gap='md'>
										<Avatar radius='xl' color='blue' variant='light'>
											<IconUser size={20} />
										</Avatar>
										<Stack gap={2}>
											<Text fw={600}>{guardian.name}</Text>
											<Badge variant='light' size='sm'>
												{guardian.relationship}
											</Badge>
										</Stack>
									</Group>
									<Group gap={4}>
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

								{(guardian.occupation || guardian.companyName) && (
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

								<Stack gap='xs'>
									<Text size='xs' c='dimmed' tt='uppercase' fw={500}>
										Phone Numbers
									</Text>
									{guardian.phones.length > 0 ? (
										<Group gap='xs'>
											{guardian.phones.map((phone) => (
												<Badge
													key={phone.id}
													variant='outline'
													size='lg'
													rightSection={
														<ActionIcon
															size={16}
															variant='transparent'
															color='red'
															onClick={() =>
																removePhoneMutation.mutate(phone.id)
															}
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
										<Text size='sm' c='dimmed' fs='italic'>
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
												flex={1}
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
											w='fit-content'
										>
											Add Phone
										</Button>
									)}
								</Stack>
							</Stack>
						</Paper>
					))}
				</SimpleGrid>
			) : (
				<Paper p='xl' radius='md' withBorder>
					<Stack align='center' gap='xs'>
						<IconUser size={32} opacity={0.3} />
						<Text size='sm' c='dimmed'>
							No guardians added
						</Text>
					</Stack>
				</Paper>
			)}

			<Modal opened={opened} onClose={handleClose} title='Edit Guardian'>
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
							<Button type='submit' loading={updateMutation.isPending}>
								Update
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</Stack>
	);
}
