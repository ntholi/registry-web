'use client';

import { createSponsoredStudent } from '@finance/sponsors';
import { Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { SponsorForm, type SponsorFormValues } from './SponsorForm';

type Props = {
	stdNo: number;
};

const ALLOWED_ROLES = ['registry', 'admin', 'finance'];

export default function NewSponsorModal({ stdNo }: Props) {
	const { data: session } = useSession();
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const canEdit = ALLOWED_ROLES.includes(session?.user?.role || '');

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
			close();
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

	const handleSubmit = (values: SponsorFormValues) => {
		createMutation.mutate({
			stdNo,
			sponsorId: Number(values.sponsorId),
			borrowerNo: values.borrowerNo || undefined,
			bankName: values.bankName || undefined,
			accountNumber: values.accountNumber || undefined,
		});
	};

	if (!canEdit) return null;

	return (
		<>
			<Button
				leftSection={<IconPlus size={14} />}
				variant='filled'
				size='xs'
				color='blue'
				onClick={open}
			>
				New Sponsor
			</Button>
			<Modal
				opened={opened}
				onClose={close}
				title='Create Sponsorship Record'
				size='md'
				centered
			>
				{opened && (
					<SponsorForm
						onSubmit={handleSubmit}
						onCancel={close}
						isPending={createMutation.isPending}
						submitLabel='Create'
					/>
				)}
			</Modal>
		</>
	);
}
