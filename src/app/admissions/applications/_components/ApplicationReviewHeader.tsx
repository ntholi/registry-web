'use client';

import { applicationStatusEnum } from '@admissions/_database';
import {
	Button,
	Divider,
	Flex,
	Group,
	Modal,
	SegmentedControl,
	Textarea,
	Title,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ApplicationStatus } from '../_lib/types';
import { changeApplicationStatus } from '../_server/actions';

type Props = {
	applicationId: string;
	applicantName: string;
	currentStatus: ApplicationStatus;
};

const STATUS_OPTIONS = applicationStatusEnum.enumValues
	.filter((s) => s !== 'draft')
	.map((s) => ({
		value: s,
		label: s
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase())
			.replace('Accepted First Choice', '1st Choice')
			.replace('Accepted Second Choice', '2nd Choice'),
	}));

export default function ApplicationReviewHeader({
	applicationId,
	applicantName,
	currentStatus,
}: Props) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const queryClient = useQueryClient();
	const [selected, setSelected] = useState<ApplicationStatus>(currentStatus);
	const [rejectionReason, setRejectionReason] = useState('');
	const [opened, { open, close }] = useDisclosure(false);

	const isDirty = selected !== currentStatus;

	const mutation = useMutation({
		mutationFn: async (reason?: string) => {
			await changeApplicationStatus(applicationId, selected, undefined, reason);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applications'] });
			close();
			setRejectionReason('');
			notifications.show({
				title: 'Status Updated',
				message: `Application status changed successfully`,
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

	function handleSave() {
		if (selected === 'rejected') {
			open();
		} else {
			mutation.mutate(undefined);
		}
	}

	function confirmReject() {
		if (!rejectionReason.trim()) {
			notifications.show({
				title: 'Error',
				message: 'Rejection reason is required',
				color: 'red',
			});
			return;
		}
		mutation.mutate(rejectionReason);
	}

	return (
		<>
			<Modal opened={opened} onClose={close} title='Rejection Reason' centered>
				<Textarea
					placeholder='Reason for rejection...'
					value={rejectionReason}
					onChange={(e) => setRejectionReason(e.currentTarget.value)}
					autosize
					minRows={3}
					maxRows={6}
					mb='md'
				/>
				<Group justify='flex-end'>
					<Button variant='default' onClick={close}>
						Cancel
					</Button>
					<Button
						color='red'
						loading={mutation.isPending}
						onClick={confirmReject}
					>
						Confirm Rejection
					</Button>
				</Group>
			</Modal>

			<Flex justify='space-between' align='center' gap='sm' wrap='wrap'>
				<Title order={3} fw={100} size={isMobile ? '1rem' : undefined}>
					{applicantName}
				</Title>
				<Group gap='xs'>
					<SegmentedControl
						size='xs'
						value={selected}
						color='teal'
						onChange={(val) => setSelected(val as ApplicationStatus)}
						data={STATUS_OPTIONS}
					/>
					<Button
						size='sm'
						disabled={!isDirty}
						loading={mutation.isPending && selected !== 'rejected'}
						onClick={handleSave}
					>
						Save
					</Button>
				</Group>
			</Flex>
			<Divider my={15} />
		</>
	);
}
