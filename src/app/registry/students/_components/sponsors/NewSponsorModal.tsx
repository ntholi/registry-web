'use client';

import { createSponsoredStudent, findAllSponsors } from '@finance/sponsors';
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

type Props = {
	stdNo: number;
};

const ALLOWED_ROLES = ['registry', 'admin', 'finance'];

export default function NewSponsorModal({ stdNo }: Props) {
	const { data: session } = useSession();
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const canEdit = ALLOWED_ROLES.includes(session?.user?.role || '');

	const form = useForm({
		initialValues: {
			sponsorId: '',
			borrowerNo: '',
			bankName: '',
			accountNumber: '',
		},
		validate: {
			sponsorId: (value) => (!value ? 'Sponsor is required' : null),
		},
	});

	const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => findAllSponsors(1, '').then((response) => response.items),
		enabled: opened,
	});

	const createMutation = useMutation({
		mutationFn: async (data: {
			stdNo: number;
			sponsorId: number;
			borrowerNo?: string;
			bankName?: string;
			accountNumber?: string;
		}) => createSponsoredStudent(data),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Sponsorship record created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['student-sponsors'] });
			queryClient.invalidateQueries({
				queryKey: ['student-registration-data'],
			});
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error
						? error.message
						: 'Failed to create sponsorship record',
				color: 'red',
			});
		},
	});

	const sponsorOptions =
		sponsors?.map((sponsor) => ({
			value: sponsor.id.toString(),
			label: sponsor.name,
		})) || [];

	const handleSubmit = form.onSubmit((values) => {
		createMutation.mutate({
			stdNo,
			sponsorId: Number(values.sponsorId),
			borrowerNo: values.borrowerNo || undefined,
			bankName: values.bankName || undefined,
			accountNumber: values.accountNumber || undefined,
		});
	});

	const handleClose = () => {
		form.reset();
		close();
	};

	if (!canEdit) return null;

	return (
		<>
			<Button
				leftSection={<IconPlus size={14} />}
				variant='filled'
				size='sm'
				color='blue'
				onClick={open}
			>
				New Sponsor
			</Button>
			<Modal
				opened={opened}
				onClose={handleClose}
				title='Create Sponsorship Record'
				size='md'
				centered
			>
				<form onSubmit={handleSubmit}>
					<Stack gap='md'>
						<Select
							label='Sponsor'
							placeholder='Select a sponsor'
							data={sponsorOptions}
							required
							disabled={isLoadingSponsors}
							searchable
							comboboxProps={{ withinPortal: true }}
							{...form.getInputProps('sponsorId')}
						/>

						<TextInput
							label='Borrower Number'
							placeholder='(Optional)'
							{...form.getInputProps('borrowerNo')}
						/>

						<TextInput
							label='Bank Name'
							placeholder='(Optional)'
							{...form.getInputProps('bankName')}
						/>

						<TextInput
							label='Account Number'
							placeholder='(Optional)'
							{...form.getInputProps('accountNumber')}
						/>

						<Group justify='flex-end' gap='sm'>
							<Button
								variant='light'
								onClick={handleClose}
								disabled={createMutation.isPending}
							>
								Cancel
							</Button>
							<Button type='submit' loading={createMutation.isPending}>
								Create
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
