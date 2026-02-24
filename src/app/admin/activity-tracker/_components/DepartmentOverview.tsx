'use client';

import {
	Center,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getDepartmentSummary } from '../_server/actions';

type Props = {
	start: string;
	end: string;
	dept?: string;
};

export default function DepartmentOverview({ start, end, dept }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ['activity-tracker', 'summary', start, end, dept],
		queryFn: () => getDepartmentSummary(start, end, dept),
	});

	if (isLoading) {
		return (
			<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }}>
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={`stat-skel-${i}`} h={100} radius='md' />
				))}
			</SimpleGrid>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Center py='xl'>
				<Stack align='center' gap='xs'>
					<IconDatabaseOff size={32} opacity={0.5} />
					<Text c='dimmed'>No activity found for this period</Text>
				</Stack>
			</Center>
		);
	}

	const total = data.reduce((s, d) => s + d.count, 0);

	return (
		<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }}>
			{data.map((item) => {
				const pct = total > 0 ? (item.count / total) * 100 : 0;
				return (
					<Paper key={item.activityType} p='md' radius='md' withBorder>
						<Stack gap={4}>
							<Text fz={28} fw={700} lh={1.2}>
								{item.count.toLocaleString()}
							</Text>
							<Text fz='sm' c='dimmed' lineClamp={1}>
								{item.label}
							</Text>
							<Text fz='xs' c='dimmed'>
								{pct.toFixed(1)}%
							</Text>
						</Stack>
					</Paper>
				);
			})}
		</SimpleGrid>
	);
}
