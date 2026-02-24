'use client';

import {
	ActionIcon,
	Avatar,
	Center,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconArrowLeft, IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { TimePreset } from '../_lib/types';
import {
	getEmployeeTotalActivities,
	getEmployeeUser,
} from '../_server/actions';
import ActivityBreakdownChart from './ActivityBreakdownChart';
import ActivityHeatmap from './ActivityHeatmap';
import ActivityTimeline from './ActivityTimeline';
import DateRangeFilter from './DateRangeFilter';

type Props = {
	userId: string;
	start: string;
	end: string;
	preset: TimePreset;
	onPresetChange: (preset: TimePreset) => void;
	onRangeChange: (range: { start: Date; end: Date }) => void;
};

export default function EmployeeDetailView({
	userId,
	start,
	end,
	preset,
	onPresetChange,
	onRangeChange,
}: Props) {
	const router = useRouter();

	const { data: user, isLoading: userLoading } = useQuery({
		queryKey: ['activity-tracker', 'user', userId],
		queryFn: () => getEmployeeUser(userId),
	});

	const { data: totalActivities } = useQuery({
		queryKey: ['activity-tracker', 'total', userId, start, end],
		queryFn: () => getEmployeeTotalActivities(userId, start, end),
	});

	if (userLoading) {
		return (
			<Stack>
				<Skeleton h={64} radius='md' />
				<Skeleton h={96} radius='md' />
				<Skeleton h={340} radius='md' />
				<Skeleton h={300} radius='md' />
			</Stack>
		);
	}

	if (!user) {
		return (
			<Center py='xl'>
				<Stack align='center' gap='xs'>
					<IconDatabaseOff size={32} opacity={0.5} />
					<Text c='dimmed'>Employee not found</Text>
				</Stack>
			</Center>
		);
	}

	return (
		<Stack>
			<Group justify='space-between'>
				<Group>
					<ActionIcon
						variant='subtle'
						onClick={() => router.push('/admin/activity-tracker')}
					>
						<IconArrowLeft size={18} />
					</ActionIcon>
					<Avatar src={user.image} size='md' radius='xl'>
						{user.name
							?.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2)
							.toUpperCase()}
					</Avatar>
					<div>
						<Title order={4}>{user.name ?? 'Unknown'}</Title>
						<Text fz='sm' c='dimmed'>
							{user.role} — {totalActivities ?? 0} activities in period
						</Text>
					</div>
				</Group>
				<DateRangeFilter
					value={{
						start: new Date(start),
						end: new Date(end),
					}}
					onChange={onRangeChange}
					preset={preset}
					onPresetChange={onPresetChange}
				/>
			</Group>

			<Paper p='md' radius='md' withBorder>
				<Text fz='xl' fw={700}>
					{(totalActivities ?? 0).toLocaleString()}
				</Text>
				<Text fz='sm' c='dimmed'>
					Total Activities
				</Text>
			</Paper>

			<Stack>
				<ActivityBreakdownChart userId={userId} start={start} end={end} />
				<ActivityHeatmap userId={userId} start={start} end={end} />
			</Stack>

			<ActivityTimeline userId={userId} start={start} end={end} />
		</Stack>
	);
}
