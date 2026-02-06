'use client';

import {
	ActionIcon,
	Avatar,
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Modal,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPhone, IconUser } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { z } from 'zod';
import { DeleteButton } from '@/shared/ui/adease/DeleteButton';
import { deleteGuardian, updateGuardian } from '../../_server/actions';

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
	guardians: Guardian[];
};

const guardianSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	relationship: z.string().min(1, 'Relationship is required'),
	address: z.string().optional(),
	occupation: z.string().optional(),
	companyName: z.string().optional(),
});

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

	const form = useForm({
		validate: zodResolver(guardianSchema),
		initialValues: {
			name: '',
			relationship: '',
			address: '',
			occupation: '',
			companyName: '',
			phoneNumber1: '',
			phoneNumber2: '',
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
		onSuccess: () => {
			form.reset();
			setEditingGuardian(null);
			close();
			router.refresh();
			notifications.show({
				title: 'Success',
				message: 'Guardian updated successfully',
				color: 'green',
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
		}
	}

	function handleClose() {
		form.reset();
		setEditingGuardian(null);
		close();
	}

	return (
		<Stack gap='xl'>
			{guardians.length > 0 ? (
				<SimpleGrid cols={{ base: 1, md: 2 }}>
					{guardians.map((guardian) => (
						<Paper key={guardian.id} p='xl' radius='md' withBorder shadow='sm'>
							<Stack gap='lg'>
								<Group justify='space-between' align='flex-start'>
									<Box>
										<Text fw={700} size='lg'>
											{guardian.name}
										</Text>
										<Text
											size='xs'
											c='dimmed'
											fw={700}
											tt='uppercase'
											lts='1px'
										>
											{guardian.relationship}
										</Text>
									</Box>
									<Group gap='xs'>
										<Tooltip label='Edit Guardian'>
											<ActionIcon
												variant='subtle'
												color='blue'
												onClick={() => handleEdit(guardian)}
												size='md'
											>
												<IconEdit size={18} />
											</ActionIcon>
										</Tooltip>
										<DeleteButton
											handleDelete={async () => {
												await deleteGuardian(guardian.id);
											}}
											variant='subtle'
											color='red'
											size='md'
										/>
									</Group>
								</Group>

								<Divider variant='dashed' />

								<Stack gap='sm'>
									<Box>
										<Text size='xs' c='dimmed'>
											Occupation
										</Text>
										<Text size='xs' fw={500}>
											{guardian.occupation || 'N/A'}
										</Text>
									</Box>
									<Box>
										<Text size='xs' c='dimmed'>
											Company
										</Text>
										<Text size='sm' fw={500}>
											{guardian.companyName || 'N/A'}
										</Text>
									</Box>
									<Box>
										<Text size='0.8rem' c='dimmed'>
											Contact Address
										</Text>
										<Text size='sm' fw={500}>
											{guardian.address || 'N/A'}
										</Text>
									</Box>
								</Stack>

								<Divider variant='dashed' />
								<Stack gap='xs'>
									<Text size='xs' c='dimmed' fw={700} tt='uppercase'>
										Phone Numbers
									</Text>
									<Group gap='xs'>
										{guardian.phones.map((phone) => (
											<Badge
												key={phone.id}
												variant='light'
												size='sm'
												leftSection={<IconPhone size={12} />}
											>
												{phone.phoneNumber}
											</Badge>
										))}
										{guardian.phones.length === 0 && (
											<Text size='xs' c='dimmed' fs='italic'>
												No phone numbers recorded
											</Text>
										)}
									</Group>
								</Stack>
							</Stack>
						</Paper>
					))}
				</SimpleGrid>
			) : (
				<Paper p='xl' radius='md' withBorder>
					<Stack align='center' gap='sm' py='xl'>
						<Avatar size={64} radius='xl' variant='light' color='gray'>
							<IconUser size={32} />
						</Avatar>
						<Box style={{ textAlign: 'center' }}>
							<Text fw={600}>No guardians found</Text>
							<Text size='sm' c='dimmed'>
								There are no guardians registered for this applicant yet.
							</Text>
						</Box>
					</Stack>
				</Paper>
			)}

			<Modal
				opened={opened}
				onClose={handleClose}
				title={
					<Text fw={700} size='lg'>
						Edit Guardian Information
					</Text>
				}
				radius='md'
				centered
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack gap='md' p='md'>
						<TextInput
							label='Full Name'
							required
							{...form.getInputProps('name')}
							placeholder='e.g. John Doe'
						/>
						<Select
							label='Relationship'
							required
							data={relationshipOptions}
							{...form.getInputProps('relationship')}
							placeholder='Select relationship'
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
							placeholder='e.g. Software Engineer'
						/>
						<TextInput
							label='Company Name'
							{...form.getInputProps('companyName')}
							placeholder='e.g. Tech Corp'
						/>
						<Textarea
							label='Home Address'
							rows={3}
							{...form.getInputProps('address')}
							placeholder='Enter full address'
						/>
						<Group justify='flex-end' pt='md'>
							<Button variant='subtle' onClick={handleClose}>
								Cancel
							</Button>
							<Button type='submit' loading={updateMutation.isPending}>
								Save Changes
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</Stack>
	);
}
