'use client';

import { Group, Stack, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
	const [start, setStart] = useState<string | null>(startDate);
	const [end, setEnd] = useState<string | null>(endDate);

	const mutation = useMutation({
		mutationFn: (data: { startDate: string | null; endDate: string | null }) =>
			updateRegistrationDates(termId, data.startDate, data.endDate),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Registration dates updated',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['term-settings', termId] });
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const handleStartChange = (date: string | null) => {
		setStart(date);
		mutation.mutate({
			startDate: date,
			endDate: end,
		});
	};

	const handleEndChange = (date: string | null) => {
		setEnd(date);
		mutation.mutate({
			startDate: start,
			endDate: date,
		});
	};

	return (
		<Stack gap='sm'>
			<Group grow>
				<DateInput
					label='Registration Start'
					placeholder='Select date'
					value={start}
					onChange={handleStartChange}
					clearable
					firstDayOfWeek={0}
				/>
				<DateInput
					label='Registration End'
					placeholder='Select date'
					value={end}
					onChange={handleEndChange}
					clearable
					firstDayOfWeek={0}
				/>
			</Group>
			<Text size='xs' c='dimmed'>
				Dates when students can submit registration requests
			</Text>
		</Stack>
	);
}
