'use client';

import { Button, Group, Stack, Switch, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { updateGradebookAccess } from '../_server/settings-actions';

interface Props {
	termId: number;
	access: boolean;
	openDate: string | null;
	closeDate: string | null;
}

export default function GradebookAccessButton({
	termId,
	access,
	openDate,
	closeDate,
}: Props) {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (data: {
			access: boolean;
			openDate: string | null;
			closeDate: string | null;
		}) =>
			updateGradebookAccess(termId, data.access, data.openDate, data.closeDate),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Gradebook access updated',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['terms'] });
			modals.closeAll();
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
		modals.open({
			title: 'Lecturer Gradebook Access',
			centered: true,
			children: (
				<GradebookModalContent
					access={access}
					openDate={openDate}
					closeDate={closeDate}
					onSubmit={(data) => mutation.mutate(data)}
					isPending={mutation.isPending}
				/>
			),
		});
	};

	return (
		<Button
			color={access ? 'green' : 'gray'}
			variant={access ? 'filled' : 'light'}
			onClick={openModal}
		>
			{access ? 'Gradebook Open' : 'Gradebook Closed'}
		</Button>
	);
}

interface ModalProps {
	access: boolean;
	openDate: string | null;
	closeDate: string | null;
	onSubmit: (data: {
		access: boolean;
		openDate: string | null;
		closeDate: string | null;
	}) => void;
	isPending: boolean;
}

function GradebookModalContent({
	access,
	openDate,
	closeDate,
	onSubmit,
	isPending,
}: ModalProps) {
	const [enabled, setEnabled] = useState(access);
	const [open, setOpen] = useState<string | null>(openDate);
	const [close, setClose] = useState<string | null>(closeDate);

	const handleSubmit = () => {
		onSubmit({
			access: enabled,
			openDate: open,
			closeDate: close,
		});
	};

	return (
		<Stack gap='md'>
			<Switch
				label='Allow lecturers to access gradebook'
				checked={enabled}
				onChange={(e) => setEnabled(e.currentTarget.checked)}
			/>

			{enabled && (
				<>
					<DateInput
						label='Open Date'
						placeholder='Select date'
						value={open}
						onChange={setOpen}
						clearable
						firstDayOfWeek={0}
					/>
					<DateInput
						label='Close Date'
						placeholder='Select date'
						value={close}
						onChange={setClose}
						clearable
						firstDayOfWeek={0}
					/>
					<Text size='xs' c='dimmed'>
						Leave dates empty for no restrictions
					</Text>
				</>
			)}

			<Group justify='flex-end' mt='md'>
				<Button variant='light' color='gray' onClick={() => modals.closeAll()}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} loading={isPending}>
					Save
				</Button>
			</Group>
		</Stack>
	);
}
