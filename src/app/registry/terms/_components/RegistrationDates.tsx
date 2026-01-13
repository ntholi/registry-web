'use client';

import { ActionIcon, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatDate } from '@/shared/lib/utils/dates';
import { updateRegistrationDates } from '../_server/settings-actions';

interface Props {
	termId: number;
	startDate: string | null;
	endDate: string | null;
}

export default function RegistrationDates({
	termId,
	startDate,
	endDate,
}: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [start, setStart] = useState<string | null>(null);
	const [end, setEnd] = useState<string | null>(null);
	const hasExisting = Boolean(startDate && endDate);

	const mutation = useMutation({
		mutationFn: (data: { startDate: string | null; endDate: string | null }) =>
			updateRegistrationDates(termId, data.startDate, data.endDate),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Registration dates saved',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['term-settings', termId] });
			close();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const openModal = () => {
		setStart(startDate);
		setEnd(endDate);
		open();
	};

	const handleSave = () => {
		mutation.mutate({ startDate: start, endDate: end });
	};

	const confirmDelete = () => {
		modals.openConfirmModal({
			title: 'Delete registration period',
			centered: true,
			children: (
				<Stack gap='xs'>
					<Text size='sm'>This removes the registration start/end dates.</Text>
					<Text size='sm' c='dimmed'>
						Students won’t be able to submit registration requests based on a
						defined period.
					</Text>
				</Stack>
			),
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () => mutation.mutate({ startDate: null, endDate: null }),
		});
	};

	const summary = hasExisting
		? `${formatDate(startDate, 'numeric')} – ${formatDate(endDate, 'numeric')}`
		: 'Not set';

	const canSave = Boolean(start && end) && !mutation.isPending;

	return (
		<>
			<Group justify='space-between' align='flex-start'>
				<Stack gap={2}>
					<Text size='sm' fw={500}>
						{summary}
					</Text>
					<Text size='xs' c='dimmed'>
						Dates when students can submit registration requests
					</Text>
				</Stack>
				<Group gap='xs'>
					<Button variant='light' onClick={openModal}>
						{hasExisting ? 'Edit' : 'Add'}
					</Button>
					{hasExisting ? (
						<ActionIcon
							variant='light'
							color='red'
							onClick={confirmDelete}
							disabled={mutation.isPending}
							aria-label='Delete registration period'
						>
							<IconTrash size={16} />
						</ActionIcon>
					) : null}
				</Group>
			</Group>

			<Modal
				opened={opened}
				onClose={close}
				title='Registration Period'
				centered
			>
				<Stack gap='md'>
					<Group grow>
						<DateInput
							label='Registration Start'
							placeholder='Select date'
							value={start}
							onChange={setStart}
							clearable
							firstDayOfWeek={0}
						/>
						<DateInput
							label='Registration End'
							placeholder='Select date'
							value={end}
							onChange={setEnd}
							clearable
							firstDayOfWeek={0}
						/>
					</Group>

					<Group justify='space-between'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							loading={mutation.isPending}
							disabled={!canSave}
						>
							Save
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
