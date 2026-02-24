'use client';

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
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { getEmployeeTimeline } from '../_server/actions';

type Props = {
	userId: string;
	start: string;
	end: string;
};

export default function ActivityTimeline({ userId, start, end }: Props) {
	const [page, setPage] = useState(1);

	const { data, isLoading } = useQuery({
		queryKey: ['activity-tracker', 'timeline', userId, start, end, page],
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
				{data.items.map((item) => (
					<Timeline.Item key={String(item.id)} color='blue'>
						<Group gap='xs'>
							<Badge variant='light' size='xs'>
								{item.label}
							</Badge>
							<Text fz='xs' c='dimmed'>
								{item.tableName} #{item.recordId}
							</Text>
						</Group>
						<Text fz='xs' c='dimmed' mt={2}>
							{formatRelativeTime(item.timestamp)}
						</Text>
					</Timeline.Item>
				))}
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
