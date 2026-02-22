'use client';

import {
	DEFAULT_EXCLUDE_FIELDS,
	formatFieldName,
	formatValue,
	getChangedFields,
} from '@audit-logs/_lib/audit-utils';
import {
	Badge,
	Center,
	Group,
	Pagination,
	Paper,
	Skeleton,
	Stack,
	Text,
	Timeline,
	Title,
} from '@mantine/core';
import {
	IconDatabaseOff,
	IconPencil,
	IconPlus,
	IconTrash,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { formatTableName } from '@/shared/lib/utils/utils';
import { getEmployeeTimeline } from '../_server/actions';

type Props = {
	userId: string;
	start: Date;
	end: Date;
};

const OP_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
	INSERT: { color: 'teal', icon: <IconPlus size={14} /> },
	UPDATE: { color: 'indigo', icon: <IconPencil size={14} /> },
	DELETE: { color: 'red', icon: <IconTrash size={14} /> },
};

export default function ActivityTimeline({ userId, start, end }: Props) {
	const [page, setPage] = useState(1);

	const { data, isLoading } = useQuery({
		queryKey: [
			'activity-tracker',
			'timeline',
			userId,
			start.toISOString(),
			end.toISOString(),
			page,
		],
		queryFn: () => getEmployeeTimeline(userId, start, end, page),
	});

	if (isLoading) {
		return (
			<Paper p='md' radius='md' withBorder>
				<Stack>
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={`tl-skel-${i}`} h={60} />
					))}
				</Stack>
			</Paper>
		);
	}

	if (!data || data.items.length === 0) {
		return (
			<Paper p='md' radius='md' withBorder>
				<Title order={5} mb='md'>
					Activity Timeline
				</Title>
				<Center py='xl'>
					<Stack align='center' gap='xs'>
						<IconDatabaseOff size={24} opacity={0.5} />
						<Text c='dimmed' fz='sm'>
							No activity for this period
						</Text>
					</Stack>
				</Center>
			</Paper>
		);
	}

	return (
		<Paper p='md' radius='md' withBorder>
			<Title order={5} mb='md'>
				Activity Timeline
			</Title>
			<Timeline active={data.items.length - 1} bulletSize={24} lineWidth={2}>
				{data.items.map((item) => {
					const cfg = OP_CONFIG[item.operation] ?? OP_CONFIG.UPDATE;
					const oldVals = (item.oldValues as Record<string, unknown>) ?? {};
					const newVals = (item.newValues as Record<string, unknown>) ?? {};
					const changes =
						item.operation === 'UPDATE'
							? getChangedFields(oldVals, newVals, DEFAULT_EXCLUDE_FIELDS)
							: [];

					return (
						<Timeline.Item key={item.id} bullet={cfg.icon} color={cfg.color}>
							<Group gap='xs'>
								<Badge variant='light' color={cfg.color} size='xs'>
									{item.operation}
								</Badge>
								<Text fz='sm' fw={500}>
									{formatTableName(item.tableName)}
								</Text>
								<Text fz='xs' c='dimmed'>
									#{item.recordId}
								</Text>
							</Group>
							<Text fz='xs' c='dimmed' mt={2}>
								{formatRelativeTime(item.changedAt)}
							</Text>
							{changes.length > 0 && (
								<Stack gap={2} mt='xs'>
									{changes.slice(0, 5).map((ch) => (
										<Text fz='xs' key={ch.field}>
											<Text span fw={500}>
												{formatFieldName(ch.field)}
											</Text>
											:{' '}
											<Text span c='red' td='line-through'>
												{formatValue(ch.oldValue)}
											</Text>{' '}
											→{' '}
											<Text span c='teal'>
												{formatValue(ch.newValue)}
											</Text>
										</Text>
									))}
									{changes.length > 5 && (
										<Text fz='xs' c='dimmed'>
											+{changes.length - 5} more changes
										</Text>
									)}
								</Stack>
							)}
						</Timeline.Item>
					);
				})}
			</Timeline>

			{data.totalPages > 1 && (
				<Center mt='md'>
					<Pagination
						total={data.totalPages}
						value={page}
						onChange={setPage}
						size='sm'
					/>
				</Center>
			)}
		</Paper>
	);
}
