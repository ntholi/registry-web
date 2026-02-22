'use client';

import {
	Box,
	Center,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	Title,
	Tooltip,
} from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getActivityHeatmap } from '../_server/actions';

type Props = {
	userId: string;
	start: Date;
	end: Date;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityHeatmap({ userId, start, end }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: [
			'activity-tracker',
			'heatmap',
			userId,
			start.toISOString(),
			end.toISOString(),
		],
		queryFn: () => getActivityHeatmap(userId, start, end),
	});

	if (isLoading) {
		return <Skeleton h={300} radius='md' />;
	}

	if (!data || data.length === 0) {
		return (
			<Paper p='md' radius='md' withBorder h='100%'>
				<Title order={5} mb='md'>
					Activity Heatmap
				</Title>
				<Center py='xl'>
					<Stack align='center' gap='xs'>
						<IconDatabaseOff size={24} opacity={0.5} />
						<Text c='dimmed' fz='sm'>
							No data
						</Text>
					</Stack>
				</Center>
			</Paper>
		);
	}

	const countMap = new Map<string, number>();
	let maxCount = 0;
	for (const d of data) {
		const key = `${d.dayOfWeek}-${d.hour}`;
		countMap.set(key, d.count);
		if (d.count > maxCount) maxCount = d.count;
	}

	return (
		<Paper p='md' radius='md' withBorder h='100%'>
			<Title order={5} mb='md'>
				Activity Heatmap
			</Title>
			<Box style={{ overflowX: 'auto' }}>
				<Stack gap={2}>
					<Group gap={2} ml={36}>
						{HOURS.map((h) => (
							<Text key={h} fz={10} c='dimmed' w={20} ta='center'>
								{h}
							</Text>
						))}
					</Group>
					{DAYS.map((day, dayIdx) => (
						<Group key={day} gap={2}>
							<Text fz='xs' c='dimmed' w={32} ta='right'>
								{day}
							</Text>
							{HOURS.map((hour) => {
								const cnt = countMap.get(`${dayIdx}-${hour}`) ?? 0;
								const opacity = maxCount > 0 ? cnt / maxCount : 0;
								return (
									<Tooltip
										key={`${dayIdx}-${hour}`}
										label={`${day} ${hour}:00 — ${cnt} operations`}
										withArrow
									>
										<Box
											w={20}
											h={20}
											style={{
												borderRadius: 3,
												backgroundColor:
													cnt === 0
														? 'var(--mantine-color-dark-6)'
														: `color-mix(in srgb, var(--mantine-color-blue-6) ${Math.round(opacity * 100)}%, var(--mantine-color-dark-6))`,
											}}
										/>
									</Tooltip>
								);
							})}
						</Group>
					))}
				</Stack>
			</Box>
		</Paper>
	);
}
