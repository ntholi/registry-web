'use client';

import { Button, Paper, SegmentedControl, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { clearanceRequestStatus } from '@registry/_database';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { DashboardRole } from '@/core/auth/permissions';
import { authClient } from '@/core/auth-client';
import { useActionMutation } from '@/shared/lib/hooks/use-action-mutation';
import type { ActionData } from '@/shared/lib/utils/actionResult';
import { toTitleCase } from '@/shared/lib/utils/utils';
import {
	type getGraduationClearance,
	updateGraduationClearance,
} from '../_server/clearance/actions';

type Props = {
	request: NonNullable<ActionData<typeof getGraduationClearance>>;
	setAccordion: (value: 'comments') => void;
	comment?: string;
};

type Status = Exclude<
	(typeof clearanceRequestStatus.enumValues)[number],
	'registered'
>;

export default function GraduationClearanceSwitch({
	request,
	comment,
	setAccordion,
}: Props) {
	const { data: session } = authClient.useSession();
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<Status>(request.status as Status);
	const [isStatusChanged, setIsStatusChanged] = useState(false);

	useEffect(() => {
		setIsStatusChanged(status !== request.status);
	}, [status, request.status]);

	const { mutate: submitResponse, isPending } = useActionMutation(
		() => {
			if (!session?.user?.id || !session.user?.role) {
				throw new Error('User not authenticated');
			}

			return updateGraduationClearance(
				request.id,
				{
					message: comment,
					department: session.user.role as DashboardRole,
					status,
				},
				request.graduationRequest.studentProgram.stdNo
			);
		},
		{
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
				setStatus(request.status as Status);
			},
		}
	);

	function handleSubmit() {
		submitResponse();
	}

	return (
		<Paper withBorder p='md' py={21}>
			<Stack gap={23}>
				<SegmentedControl
					value={status}
					onChange={(it) => {
						setStatus(it as Status);
						if ((it as Status) === 'rejected') {
							setAccordion('comments');
						}
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
