'use client';

import { Button, Paper, SegmentedControl, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { updateGraduationClearance } from '@/server/registry/graduation/clearance/actions';
import {
	clearanceRequestStatus,
	type dashboardUsers,
} from '@/shared/db/schema';

type Status = Exclude<
	(typeof clearanceRequestStatus.enumValues)[number],
	'registered'
>;

type Props = {
	request: {
		id: number;
		status: Status;
	};
	comment?: string;
};

export default function GraduationStatusSwitch({ request, comment }: Props) {
	const { data: session } = useSession();
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<Status>(request.status);
	const [isStatusChanged, setIsStatusChanged] = useState(false);

	useEffect(() => {
		setIsStatusChanged(status !== request.status);
	}, [status, request.status]);

	const { mutate: submitResponse, isPending } = useMutation({
		mutationFn: async () => {
			if (!session?.user?.id || !session.user?.role) {
				throw new Error('User not authenticated');
			}

			const result = await updateGraduationClearance(request.id, {
				department: session.user
					.role as (typeof dashboardUsers.enumValues)[number],
				status,
				message: comment,
			});
			return { result };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['graduation-clearances', 'pending'],
			});
			queryClient.invalidateQueries({
				queryKey: ['graduation-clearances', 'approved'],
			});
			queryClient.invalidateQueries({
				queryKey: ['graduation-clearances', 'rejected'],
			});
			notifications.show({
				title: 'Success',
				message: 'Graduation clearance updated successfully',
				color: 'green',
			});
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to submit response',
				color: 'red',
			});
			setStatus(request.status);
		},
	});

	function handleSubmit() {
		submitResponse();
	}

	return (
		<Paper withBorder p='md' py={21}>
			<Stack>
				<SegmentedControl
					value={status}
					onChange={(it) => setStatus(it as Status)}
					data={clearanceRequestStatus.enumValues.map((s) => ({
						label: s,
						value: s,
					}))}
					fullWidth
					disabled={isPending}
				/>
				<Button
					onClick={handleSubmit}
					loading={isPending}
					variant={isStatusChanged ? 'filled' : 'default'}
				>
					Submit Response
				</Button>
			</Stack>
		</Paper>
	);
}
