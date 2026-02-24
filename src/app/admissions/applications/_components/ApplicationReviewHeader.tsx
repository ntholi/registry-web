'use client';

import { applicationStatusEnum } from '@admissions/_database';
import {
	ActionIcon,
	Button,
	Divider,
	Flex,
	Group,
	Modal,
	Select,
	Text,
	Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconExternalLink } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import type { ApplicationStatus } from '../_lib/types';
import { changeApplicationStatus } from '../_server/actions';

type Props = {
	applicationId: string;
	applicantId: string;
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
	applicantId,
	applicantName,
	currentStatus,
}: Props) {
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

	function handleSaveReview() {
		if (!rejectionReason.trim()) {
			if (selected === 'rejected') {
				notifications.show({
					title: 'Error',
					message: 'Rejection reason is required',
					color: 'red',
				});
				return;
			}
			mutation.mutate(undefined);
			return;
		}
		mutation.mutate(rejectionReason);
	}

	return (
		<>
			<Modal
				opened={opened}
				onClose={close}
				title='Review Application'
				centered
			>
				<Select
					label='Status'
					value={selected}
					checkIconPosition='right'
					onChange={(val) =>
						setSelected((val as ApplicationStatus | null) ?? selected)
					}
					data={STATUS_OPTIONS}
					mb='md'
				/>
				{selected === 'rejected' ? (
					<Textarea
						placeholder='Reason for rejection...'
						value={rejectionReason}
						onChange={(e) => setRejectionReason(e.currentTarget.value)}
						autosize
						minRows={3}
						maxRows={6}
						mb='md'
					/>
				) : null}
				<Group justify='flex-end'>
					<Button variant='default' onClick={close}>
						Cancel
					</Button>
					<Button
						loading={mutation.isPending}
						disabled={!isDirty}
						onClick={handleSaveReview}
					>
						Save
					</Button>
				</Group>
			</Modal>

			<Flex justify='space-between' align='center' gap='sm' wrap='wrap'>
				<Group gap='xs'>
					<Text fw={500}>{applicantName}</Text>
					<ActionIcon
						variant='transparent'
						color='gray'
						component={Link}
						href={`/admissions/applicants/${applicantId}`}
						target='_blank'
					>
						<IconExternalLink size='1rem' />
					</ActionIcon>
				</Group>
				<Button size='sm' onClick={open}>
					Review
				</Button>
			</Flex>
			<Divider my={15} />
		</>
	);
}
