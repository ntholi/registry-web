'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Group,
	Modal,
	Select,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import {
	addNewGuardian,
	removeGuardian,
	updateExistingGuardian,
} from '../_server/actions';

type Guardian = {
	id: string;
	name: string;
	relationship: string;
	address: string | null;
	occupation: string | null;
	companyName: string | null;
	phones: { id: string; phoneNumber: string }[];
};

const relationshipOptions = [
	{ value: 'Father', label: 'Father' },
	{ value: 'Mother', label: 'Mother' },
	{ value: 'Guardian', label: 'Guardian' },
	{ value: 'Sponsor', label: 'Sponsor' },
	{ value: 'Other', label: 'Other' },
];

export default function GuardianManager() {
	const { applicant, refetch } = useApplicant();
	const applicantId = applicant?.id ?? '';
	const guardians = (applicant?.guardians ?? []) as Guardian[];

	const [opened, { open, close }] = useDisclosure(false);
	const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
	const isMobile = useMediaQuery('(max-width: 600px)');

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
		mutationFn: async (values: typeof form.values) => {
			const { phoneNumber1, phoneNumber2, ...data } = values;
			const res = await addNewGuardian(
				{ ...data, applicantId },
				[phoneNumber1, phoneNumber2].filter(Boolean)
			);
			if (!res.success) throw new Error(res.error);
		},
		onSuccess: async () => {
			await refetch();
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
		mutationFn: async ({
			id,
			values,
		}: {
			id: string;
			values: typeof form.values;
		}) => {
			const { phoneNumber1, phoneNumber2, ...data } = values;
			const res = await updateExistingGuardian(
				id,
				data,
				[phoneNumber1, phoneNumber2].filter(Boolean)
			);
			if (!res.success) throw new Error(res.error);
		},
		onSuccess: async () => {
			await refetch();
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
		mutationFn: async (id: string) => {
			const res = await removeGuardian(id);
			if (!res.success) throw new Error(res.error);
		},
		onSuccess: async () => {
			await refetch();
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

	function handleClose() {
		form.reset();
		setEditingGuardian(null);
		close();
	}

	function handleSubmit(values: typeof form.values) {
		if (editingGuardian) {
			updateMutation.mutate({ id: editingGuardian.id, values });
		} else {
			createMutation.mutate(values);
		}
	}

	return (
		<Stack gap='md'>
			{guardians.length > 0 ? (
				guardians.map((guardian) => (
					<Card key={guardian.id} withBorder radius='md' p='sm'>
						<Stack gap='xs'>
							<Group justify='space-between'>
								<Text fw={500}>{guardian.name}</Text>
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
							<Badge variant='default' size='sm' radius='xs'>
								{guardian.relationship}
							</Badge>
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
					<Stack gap='md'>
						<TextInput label='Name' required {...form.getInputProps('name')} />
						<Select
							label='Relationship'
							required
							data={relationshipOptions}
							{...form.getInputProps('relationship')}
						/>
						<SimpleGrid cols={{ base: 1, sm: 2 }}>
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
						</SimpleGrid>
						{!isMobile && (
							<>
								<TextInput
									label='Occupation'
									{...form.getInputProps('occupation')}
								/>
								<TextInput
									label='Company / Employer'
									{...form.getInputProps('companyName')}
								/>
							</>
						)}
						<Textarea
							label='Address'
							description='Residential or physical address'
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
