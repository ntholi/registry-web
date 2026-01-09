'use client';

import { Badge, Stack, Text, Timeline } from '@mantine/core';
import {
	IconArrowRight,
	IconCircleCheck,
	IconCircleX,
	IconClock,
} from '@tabler/icons-react';
import {
	type ApplicationStatusType,
	getApplicationStatusColor,
} from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';

type HistoryEntry = {
	id: number;
	fromStatus: string | null;
	toStatus: string;
	changedBy: string | null;
	changedByUser: { id: string; name: string | null } | null;
	notes: string | null;
	rejectionReason: string | null;
	changedAt: Date | null;
};

type Props = {
	history: HistoryEntry[];
};

function getStatusIcon(status: string) {
	const normalized = status.toLowerCase();
	if (normalized.includes('accepted')) {
		return <IconCircleCheck size={14} />;
	}
	if (normalized === 'rejected') {
		return <IconCircleX size={14} />;
	}
	return <IconClock size={14} />;
}

function formatStatus(status: string) {
	return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusHistory({ history }: Props) {
	if (history.length === 0) {
		return (
			<Text size='sm' c='dimmed'>
				No status history
			</Text>
		);
	}

	return (
		<Timeline active={history.length - 1} bulletSize={24} lineWidth={2}>
			{history.map((entry) => (
				<Timeline.Item
					key={entry.id}
					bullet={getStatusIcon(entry.toStatus)}
					color={getApplicationStatusColor(
						entry.toStatus as ApplicationStatusType
					)}
				>
					<Stack gap={4}>
						<Text size='sm' fw={500}>
							{entry.fromStatus ? (
								<>
									<Badge
										size='xs'
										color={getApplicationStatusColor(
											entry.fromStatus as ApplicationStatusType
										)}
										variant='light'
									>
										{formatStatus(entry.fromStatus)}
									</Badge>
									<IconArrowRight
										size={12}
										style={{
											display: 'inline',
											verticalAlign: 'middle',
											margin: '0 4px',
										}}
									/>
									<Badge
										size='xs'
										color={getApplicationStatusColor(
											entry.toStatus as ApplicationStatusType
										)}
										variant='light'
									>
										{formatStatus(entry.toStatus)}
									</Badge>
								</>
							) : (
								<Badge
									size='xs'
									color={getApplicationStatusColor(
										entry.toStatus as ApplicationStatusType
									)}
									variant='light'
								>
									{formatStatus(entry.toStatus)}
								</Badge>
							)}
						</Text>

						<Text size='xs' c='dimmed'>
							{entry.changedByUser?.name || 'System'} •{' '}
							{entry.changedAt ? formatDateTime(entry.changedAt) : ''}
						</Text>

						{entry.notes && (
							<Text size='xs' c='dimmed' mt={4}>
								{entry.notes}
							</Text>
						)}

						{entry.rejectionReason && (
							<Text size='xs' c='red' mt={4}>
								Reason: {entry.rejectionReason}
							</Text>
						)}
					</Stack>
				</Timeline.Item>
			))}
		</Timeline>
	);
}
