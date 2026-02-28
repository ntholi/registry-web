'use client';

import {
	Badge,
	Button,
	Group,
	Modal,
	Stack,
	Table,
	Text,
	Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { getApprovalRoleLabel } from '../_lib/labels';
import {
	approveStudentStatusStep,
	rejectStudentStatusStep,
} from '../_server/actions';

type Approval = {
	id: number;
	approverRole: string;
	status: string;
	respondedBy: string | null;
	message: string | null;
	respondedAt: Date | null;
	responder: { name: string | null } | null;
};

type Props = {
	approvals: Approval[];
	applicationStatus: string;
	applicationId: number;
};

export default function ApprovalPanel({
	approvals,
	applicationStatus,
	applicationId,
}: Props) {
	const { data: session } = useSession();
	const _queryClient = useQueryClient();

	function canApprove(approverRole: string) {
		if (!session?.user) return false;
		const { role, position } = session.user;
		switch (approverRole) {
			case 'year_leader':
				return role === 'academic' && position === 'year_leader';
			case 'program_leader':
				return (
					role === 'academic' &&
					(position === 'manager' || position === 'program_leader')
				);
			case 'student_services':
				return role === 'student_services';
			case 'finance':
				return role === 'finance';
			default:
				return false;
		}
	}

	return (
		<Table>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Role</Table.Th>
					<Table.Th>Status</Table.Th>
					<Table.Th>Responded By</Table.Th>
					<Table.Th>Date</Table.Th>
					<Table.Th>Message</Table.Th>
					<Table.Th>Actions</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{approvals.map((approval) => (
					<Table.Tr key={approval.id}>
						<Table.Td>{getApprovalRoleLabel(approval.approverRole)}</Table.Td>
						<Table.Td>
							<Badge
								color={getStatusColor(approval.status as AllStatusType)}
								variant='light'
							>
								{approval.status}
							</Badge>
						</Table.Td>
						<Table.Td>{approval.responder?.name ?? '-'}</Table.Td>
						<Table.Td>
							{approval.respondedAt
								? formatDateTime(approval.respondedAt, 'long')
								: '-'}
						</Table.Td>
						<Table.Td>
							<Text size='sm' lineClamp={2}>
								{approval.message ?? '-'}
							</Text>
						</Table.Td>
						<Table.Td>
							{applicationStatus === 'pending' &&
								approval.status === 'pending' &&
								canApprove(approval.approverRole) && (
									<ApprovalActions
										approvalId={approval.id}
										applicationId={applicationId}
									/>
								)}
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}

type ApprovalActionsProps = {
	approvalId: number;
	applicationId: number;
};

function ApprovalActions({ approvalId, applicationId }: ApprovalActionsProps) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [message, setMessage] = useState('');

	const approveMutation = useMutation({
		mutationFn: () => approveStudentStatusStep(approvalId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['student-status', applicationId],
			});
			queryClient.invalidateQueries({ queryKey: ['student-statuses'] });
		},
	});

	const rejectMutation = useMutation({
		mutationFn: () => rejectStudentStatusStep(approvalId, message),
		onSuccess: () => {
			close();
			setMessage('');
			queryClient.invalidateQueries({
				queryKey: ['student-status', applicationId],
			});
			queryClient.invalidateQueries({ queryKey: ['student-statuses'] });
		},
	});

	return (
		<>
			<Group gap='xs'>
				<Button
					size='xs'
					color='green'
					leftSection={<IconCheck size={14} />}
					loading={approveMutation.isPending}
					onClick={() => approveMutation.mutate()}
				>
					Approve
				</Button>
				<Button
					size='xs'
					color='red'
					variant='light'
					leftSection={<IconX size={14} />}
					onClick={open}
				>
					Reject
				</Button>
			</Group>
			<Modal opened={opened} onClose={close} title='Reject Approval Step'>
				<Stack>
					<Textarea
						label='Rejection Reason'
						required
						value={message}
						onChange={(e) => setMessage(e.currentTarget.value)}
						minRows={3}
					/>
					<Group justify='flex-end'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							color='red'
							loading={rejectMutation.isPending}
							disabled={!message.trim()}
							onClick={() => rejectMutation.mutate()}
						>
							Reject
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
