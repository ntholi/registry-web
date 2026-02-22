'use client';

import {
	Center,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconActivity,
	IconDatabaseOff,
	IconPencil,
	IconPlus,
	IconUsers,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getDepartmentSummary } from '../_server/actions';

type Props = {
	start: Date;
	end: Date;
	dept?: string;
};

type StatCardProps = {
	label: string;
	value: string | number;
	icon: React.ReactNode;
	color: string;
};

function StatCard({ label, value, icon, color }: StatCardProps) {
	return (
		<Paper p='md' radius='md' withBorder>
			<Stack gap={4} align='flex-start'>
				<ThemeIcon variant='light' color={color} size='lg' radius='md'>
					{icon}
				</ThemeIcon>
				<Text fz={28} fw={700} lh={1.2}>
					{value}
				</Text>
				<Text fz='sm' c='dimmed'>
					{label}
				</Text>
			</Stack>
		</Paper>
	);
}

export default function DepartmentOverview({ start, end, dept }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: [
			'activity-tracker',
			'summary',
			start.toISOString(),
			end.toISOString(),
			dept,
		],
		queryFn: () => getDepartmentSummary(start, end, dept),
	});

	if (isLoading) {
		return (
			<SimpleGrid cols={{ base: 2, sm: 4 }}>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={`stat-skel-${i}`} h={120} radius='md' />
				))}
			</SimpleGrid>
		);
	}

	if (!data || data.totalOperations === 0) {
		return (
			<Center py='xl'>
				<Stack align='center' gap='xs'>
					<IconDatabaseOff size={32} opacity={0.5} />
					<Text c='dimmed'>No activity found for this period</Text>
				</Stack>
			</Center>
		);
	}

	return (
		<SimpleGrid cols={{ base: 2, sm: 4 }}>
			<StatCard
				label='Total Operations'
				value={data.totalOperations.toLocaleString()}
				icon={<IconActivity size={20} />}
				color='blue'
			/>
			<StatCard
				label='Active Employees'
				value={`${data.activeEmployees} / ${data.totalEmployees}`}
				icon={<IconUsers size={20} />}
				color='green'
			/>
			<StatCard
				label='Creates'
				value={data.operationsByType.inserts.toLocaleString()}
				icon={<IconPlus size={20} />}
				color='teal'
			/>
			<StatCard
				label='Updates'
				value={data.operationsByType.updates.toLocaleString()}
				icon={<IconPencil size={20} />}
				color='indigo'
			/>
		</SimpleGrid>
	);
}
