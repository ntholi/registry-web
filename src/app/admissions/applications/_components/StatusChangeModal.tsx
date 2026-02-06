'use client';

import { applicationStatusEnum } from '@admissions/_database';
import { Button, Group, Modal, Select, Stack, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconStatusChange } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ApplicationStatus } from '../_lib/types';
import { changeApplicationStatus } from '../_server/actions';

type Props = {
	applicationId: string;
	currentStatus: ApplicationStatus;
};

function getStatusOptions(current: ApplicationStatus) {
	return applicationStatusEnum.enumValues
		.filter((s) => s !== 'draft' && s !== current)
		.map((status) => ({
			value: status,
			label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
		}));
}

export default function StatusChangeModal({
	applicationId,
	currentStatus,
}: Props) {
	const statusOptions = getStatusOptions(currentStatus);
	const [opened, { open, close }] = useDisclosure(false);
	const [newStatus, setNewStatus] = useState<ApplicationStatus | null>(null);
	const [notes, setNotes] = useState('');
	const [rejectionReason, setRejectionReason] = useState('');
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async () => {
			if (!newStatus) throw new Error('Please select a status');
			if (newStatus === 'rejected' && !rejectionReason.trim()) {
				throw new Error('Rejection reason is required');
			}
			return changeApplicationStatus(
				applicationId,
				newStatus,
				notes || undefined,
				newStatus === 'rejected' ? rejectionReason : undefined
			);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applications'] });
			notifications.show({
				title: 'Success',
				message: 'Status updated successfully',
				color: 'green',
			});
			close();
			resetForm();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function resetForm() {
		setNewStatus(null);
		setNotes('');
		setRejectionReason('');
	}

	function handleClose() {
		resetForm();
		close();
	}

	return (
		<>
			<Button
				variant='light'
				leftSection={<IconStatusChange size={16} />}
				onClick={open}
			>
				Change Status
			</Button>

			<Modal opened={opened} onClose={handleClose} title='Change Status'>
				<Stack>
					<Select
						label='New Status'
						placeholder='Select status'
						data={statusOptions}
						value={newStatus}
						onChange={(val) => setNewStatus(val as ApplicationStatus)}
						required
					/>

					<Textarea
						label='Notes'
						placeholder='Optional notes about this status change'
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						minRows={2}
					/>

					{newStatus === 'rejected' && (
						<Textarea
							label='Rejection Reason'
							placeholder='Reason for rejection (required)'
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							required
							minRows={3}
							error={
								newStatus === 'rejected' && !rejectionReason.trim()
									? 'Rejection reason is required'
									: undefined
							}
						/>
					)}

					<Group justify='flex-end'>
						<Button variant='subtle' onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
							disabled={
								!newStatus ||
								(newStatus === 'rejected' && !rejectionReason.trim())
							}
						>
							Update Status
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
