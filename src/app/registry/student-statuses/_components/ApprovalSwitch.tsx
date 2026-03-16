'use client';

import {
	Badge,
	Button,
	Paper,
	SegmentedControl,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { authClient } from '@/core/auth-client';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { getApprovalRolesByUser } from '../_lib/approvalRoles';
import { getApprovalRoleLabel } from '../_lib/labels';
import type { StudentStatusApprovalRole } from '../_lib/types';
import { respondToStudentStatusStep } from '../_server/actions';

type Approval = {
	id: string;
	approverRole: StudentStatusApprovalRole;
	status: string;
	respondedBy: string | null;
	comments: string | null;
	respondedAt: Date | null;
	responder: { name: string | null } | null;
};

type Props = {
	approvals: Approval[];
	applicationStatus: string;
	applicationId: string;
	comment?: string;
	setAccordion?: (value: string) => void;
};

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export default function ApprovalSwitch({
	approvals,
	applicationStatus,
	applicationId,
	comment,
	setAccordion,
}: Props) {
	const { data: session } = authClient.useSession();
	const userRoles = getApprovalRolesByUser(session);

	const myApproval = approvals.find((a) => userRoles.includes(a.approverRole));

	if (!myApproval) {
		return (
			<Paper withBorder p='md'>
				<Text c='dimmed' size='sm' ta='center'>
					No approval step assigned to your role
				</Text>
			</Paper>
		);
	}

	if (applicationStatus === 'approved') {
		return (
			<Paper withBorder p='md'>
				<Stack gap='sm'>
					<Text size='sm' fw={500}>
						{getApprovalRoleLabel(myApproval.approverRole)}
					</Text>
					<Badge
						color={getStatusColor(myApproval.status as AllStatusType)}
						variant='light'
					>
						{myApproval.status}
					</Badge>
					{myApproval.responder?.name && (
						<Text size='sm' c='dimmed'>
							By {myApproval.responder.name}
						</Text>
					)}
					{myApproval.respondedAt && (
						<Text size='sm' c='dimmed'>
							{formatDateTime(myApproval.respondedAt, 'long')}
						</Text>
					)}
					{myApproval.comments && <Text size='sm'>{myApproval.comments}</Text>}
				</Stack>
			</Paper>
		);
	}

	return (
		<ApprovalSwitchForm
			approval={myApproval}
			applicationId={applicationId}
			comment={comment}
			setAccordion={setAccordion}
		/>
	);
}

type FormProps = {
	approval: Approval;
	applicationId: string;
	comment?: string;
	setAccordion?: (value: string) => void;
};

function ApprovalSwitchForm({
	approval,
	applicationId,
	comment,
	setAccordion,
}: FormProps) {
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<ApprovalStatus>(
		approval.status as ApprovalStatus
	);

	const mutation = useActionMutation(
		() => respondToStudentStatusStep(approval.id, status, comment),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ['student-status', applicationId],
				});
				queryClient.invalidateQueries({ queryKey: ['student-statuses'] });
				notifications.show({
					title: 'Success',
					message: 'Response submitted successfully',
					color: 'green',
				});
			},
			onError: (error) => {
				notifications.show({
					title: 'Error',
					message: error.message || 'Failed to submit response',
					color: 'red',
				});
			},
		}
	);

	const isChanged = status !== approval.status;
	const canSubmit = isChanged;

	return (
		<Paper withBorder p='md' py={21}>
			<Stack>
				<Text size='sm' fw={500}>
					{getApprovalRoleLabel(approval.approverRole)}
				</Text>
				<SegmentedControl
					value={status}
					onChange={(v) => {
						setStatus(v as ApprovalStatus);
						if ((v as ApprovalStatus) === 'rejected') {
							setAccordion?.('comments');
						} else {
							setAccordion?.('reasons');
						}
					}}
					data={[
						{ label: 'Pending', value: 'pending' },
						{ label: 'Approve', value: 'approved' },
						{ label: 'Reject', value: 'rejected' },
					]}
					fullWidth
					disabled={mutation.isPending}
				/>
				<Button
					onClick={() => mutation.mutate()}
					loading={mutation.isPending}
					disabled={!canSubmit}
					variant={isChanged ? 'filled' : 'default'}
				>
					Submit Response
				</Button>
			</Stack>
		</Paper>
	);
}
