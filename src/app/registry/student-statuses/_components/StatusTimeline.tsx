'use client';

import { Text, Timeline } from '@mantine/core';
import {
	IconCheck,
	IconCircleCheck,
	IconClock,
	IconFileDescription,
	IconX,
} from '@tabler/icons-react';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { getApprovalRoleLabel } from '../_lib/labels';

type Approval = {
	id: number;
	approverRole: string;
	status: string;
	respondedBy: string | null;
	respondedAt: Date | null;
	responder: { name: string | null } | null;
	message: string | null;
};

type Props = {
	createdAt: Date | null;
	creatorName: string | null;
	approvals: Approval[];
	status: string;
	updatedAt: Date | null;
};

function getApprovalIcon(status: string) {
	switch (status) {
		case 'approved':
			return <IconCheck size={14} />;
		case 'rejected':
			return <IconX size={14} />;
		default:
			return <IconClock size={14} />;
	}
}

export default function StatusTimeline({
	createdAt,
	creatorName,
	approvals,
	status,
	updatedAt,
}: Props) {
	const isFinalized = status !== 'pending';

	return (
		<Timeline active={approvals.length + (isFinalized ? 1 : 0)} bulletSize={24}>
			<Timeline.Item
				bullet={<IconFileDescription size={14} />}
				title='Application Created'
			>
				<Text size='sm' c='dimmed'>
					{creatorName ?? 'Unknown'}
				</Text>
				{createdAt && (
					<Text size='xs' c='dimmed'>
						{formatDateTime(createdAt, 'long')}
					</Text>
				)}
			</Timeline.Item>

			{approvals.map((approval) => (
				<Timeline.Item
					key={approval.id}
					bullet={getApprovalIcon(approval.status)}
					color={getStatusColor(approval.status as AllStatusType)}
					title={getApprovalRoleLabel(approval.approverRole)}
				>
					<Text size='sm' c='dimmed' tt='capitalize'>
						{approval.status}
						{approval.responder && ` — ${approval.responder.name}`}
					</Text>
					{approval.respondedAt && (
						<Text size='xs' c='dimmed'>
							{formatDateTime(approval.respondedAt, 'long')}
						</Text>
					)}
					{approval.message && (
						<Text size='sm' fs='italic' mt={4}>
							{approval.message}
						</Text>
					)}
				</Timeline.Item>
			))}

			{isFinalized && (
				<Timeline.Item
					bullet={
						status === 'approved' ? (
							<IconCircleCheck size={14} />
						) : (
							<IconX size={14} />
						)
					}
					color={getStatusColor(status as AllStatusType)}
					title={`Application ${status.charAt(0).toUpperCase() + status.slice(1)}`}
				>
					{updatedAt && (
						<Text size='xs' c='dimmed'>
							{formatDateTime(updatedAt, 'long')}
						</Text>
					)}
				</Timeline.Item>
			)}
		</Timeline>
	);
}
