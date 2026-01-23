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
	createGuardian,
	deleteGuardian,
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

	const form = useForm({
		initialValues: {
			name: '',
			relationship: '',
			address: '',
			occupation: '',
			companyName: '',
			phoneNumber1: '',
			phoneNumber2: '',
		},
		validate: {
			name: (value) => (value ? null : 'Name is required'),
			relationship: (value) => (value ? null : 'Relationship is required'),
		},
	});

	const createMutation = useMutation({
		mutationFn: (values: typeof form.values) => {
			const { phoneNumber1, phoneNumber2, ...data } = values;
			return createGuardian(
				{ ...data, applicantId },
				[phoneNumber1, phoneNumber2].filter(Boolean)
			);
		},
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
		mutationFn: ({
			id,
			values,
		}: {
			id: string;
			values: typeof form.values;
		}) => {
			const { phoneNumber1, phoneNumber2, ...data } = values;
			return updateGuardian(
				id,
				data,
				[phoneNumber1, phoneNumber2].filter(Boolean)
			);
		},
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

	function handleEdit(guardian: Guardian) {
		setEditingGuardian(guardian);
		form.setValues({
			name: guardian.name,
			relationship: guardian.relationship,
			address: guardian.address || '',
			occupation: guardian.occupation || '',
			companyName: guardian.companyName || '',
			phoneNumber1: guardian.phones[0]?.phoneNumber || '',
			phoneNumber2: guardian.phones[1]?.phoneNumber || '',
		});
		open();
	}

	function handleSubmit(values: typeof form.values) {
		if (editingGuardian) {
			updateMutation.mutate({ id: editingGuardian.id, values });
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

						<Group gap='xs' mt='sm'>
							{guardian.phones.map((phone) => (
								<Badge key={phone.id} variant='outline'>
									{phone.phoneNumber}
								</Badge>
							))}
						</Group>
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
						<Group grow>
							<TextInput
								label='Phone 1'
								placeholder='Enter phone number'
								{...form.getInputProps('phoneNumber1')}
							/>
							<TextInput
								label='Phone 2'
								placeholder='Enter phone number'
								{...form.getInputProps('phoneNumber2')}
							/>
						</Group>
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
