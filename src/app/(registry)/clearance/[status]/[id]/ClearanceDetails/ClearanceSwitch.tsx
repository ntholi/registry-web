'use client';

import { Button, Paper, SegmentedControl, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { clearanceRequestStatus, type dashboardUsers } from '@/db/schema';
import { toTitleCase } from '@/lib/utils/utils';
import {
	type getClearance,
	updateClearance,
} from '@/server/registry/registration/clearance/actions';

type Props = {
	request: NonNullable<Awaited<ReturnType<typeof getClearance>>>;
	setAccordion: (value: 'comments' | 'modules') => void;
	comment?: string;
};

type Status = Exclude<
	(typeof clearanceRequestStatus.enumValues)[number],
	'registered'
>;

export default function ClearanceSwitch({
	request,
	comment,
	setAccordion,
}: Props) {
	const { data: session } = useSession();
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<Status>(request.status as Status);
	const [isStatusChanged, setIsStatusChanged] = useState(false);

	useEffect(() => {
		setIsStatusChanged(status !== request.status);
	}, [status, request.status]);

	const { mutate: submitResponse, isPending } = useMutation({
		mutationFn: async () => {
			if (!session?.user?.id || !session.user?.role) {
				throw new Error('User not authenticated');
			}

			const result = await updateClearance(request.id, {
				message: comment,
				department: session.user
					.role as (typeof dashboardUsers.enumValues)[number],
				status,
			});
			return { result };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['clearances', 'pending'],
			});
			queryClient.invalidateQueries({
				queryKey: ['clearances', 'approved'],
			});
			queryClient.invalidateQueries({
				queryKey: ['clearances', 'rejected'],
			});
			notifications.show({
				title: 'Success',
				message: 'Registration clearance updated successfully',
				color: 'green',
			});
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to submit response',
				color: 'red',
			});
			setStatus(request.registrationRequest.status as Status);
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
					onChange={(it) => {
						setStatus(it as Status);
						if ((it as Status) === 'rejected') {
							setAccordion('comments');
						} else setAccordion('modules');
					}}
					data={clearanceRequestStatus.enumValues.map((status) => ({
						label: toTitleCase(status),
						value: status,
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
