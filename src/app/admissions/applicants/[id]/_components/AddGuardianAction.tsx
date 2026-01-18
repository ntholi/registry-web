'use client';

import {
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Textarea,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { createGuardian } from '../../_server/actions';

type Props = {
	applicantId: string;
};

const relationshipOptions = [
	{ value: 'Father', label: 'Father' },
	{ value: 'Mother', label: 'Mother' },
	{ value: 'Guardian', label: 'Guardian' },
	{ value: 'Sponsor', label: 'Sponsor' },
	{ value: 'Other', label: 'Other' },
];

export default function AddGuardianAction({ applicantId }: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const form = useForm({
		initialValues: {
			name: '',
			relationship: '',
			address: '',
			occupation: '',
			companyName: '',
			phoneNumber: '',
		},
		validate: {
			name: (v) => (v ? null : 'Name is required'),
			relationship: (v) => (v ? null : 'Relationship is required'),
		},
	});

	const createMutation = useMutation({
		mutationFn: (data: typeof form.values) => {
			const { phoneNumber, ...guardianData } = data;
			return createGuardian(
				{ ...guardianData, applicantId },
				phoneNumber || undefined
			);
		},
		onSuccess: () => {
			form.reset();
			close();
			router.refresh();
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

	function handleClose() {
		form.reset();
		close();
	}

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconPlus size={16} />}
				onClick={open}
			>
				Add Guardian
			</Button>

			<Modal opened={opened} onClose={handleClose} title='Add Guardian'>
				<form
					onSubmit={form.onSubmit((values) => createMutation.mutate(values))}
				>
					<Stack gap='sm'>
						<TextInput label='Name' required {...form.getInputProps('name')} />
						<Select
							label='Relationship'
							required
							data={relationshipOptions}
							{...form.getInputProps('relationship')}
						/>
						<TextInput
							label='Phone Number'
							placeholder='Primary phone number'
							{...form.getInputProps('phoneNumber')}
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
							<Button type='submit' loading={createMutation.isPending}>
								Add
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
