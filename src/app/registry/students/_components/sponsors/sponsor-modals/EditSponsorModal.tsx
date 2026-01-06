'use client';

import { updateSponsoredStudent } from '@finance/sponsors';
import { ActionIcon, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SponsoredStudentType } from '../StudentSponsorsView';
import { SponsorForm, type SponsorFormValues } from './SponsorForm';

type EditSponsoredStudentModalProps = {
	sponsoredStudent: SponsoredStudentType;
};

export function EditSponsoredStudentModal({
	sponsoredStudent,
}: EditSponsoredStudentModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: async (data: {
			sponsorId?: number;
			borrowerNo?: string | null;
			bankName?: string | null;
			accountNumber?: string | null;
			confirmed?: boolean;
		}) => updateSponsoredStudent(sponsoredStudent.id, data),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Sponsorship record updated successfully',
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
						: 'Failed to update sponsorship record',
				color: 'red',
			});
		},
	});

	const handleSubmit = (values: SponsorFormValues) => {
		updateMutation.mutate({
			sponsorId: values.sponsorId ? Number(values.sponsorId) : undefined,
			borrowerNo: values.borrowerNo || null,
			bankName: values.bankName || null,
			accountNumber: values.accountNumber || null,
			confirmed: values.confirmed,
		});
	};

	return (
		<>
			<ActionIcon
				variant='subtle'
				color='gray'
				size='sm'
				onClick={open}
				title='Edit sponsorship record'
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={close}
				title='Edit Sponsorship Record'
				size='md'
				centered
			>
				{opened && (
					<SponsorForm
						initialValues={{
							sponsorId: sponsoredStudent.sponsor?.id.toString() || '',
							borrowerNo: sponsoredStudent.borrowerNo || '',
							bankName: sponsoredStudent.bankName || '',
							accountNumber: sponsoredStudent.accountNumber || '',
							confirmed: sponsoredStudent.confirmed || false,
						}}
						onSubmit={handleSubmit}
						onCancel={close}
						isPending={updateMutation.isPending}
						submitLabel='Update'
						showConfirmed
					/>
				)}
			</Modal>
		</>
	);
}
