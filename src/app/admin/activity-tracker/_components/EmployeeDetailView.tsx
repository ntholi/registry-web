'use client';

import {
	ActionIcon,
	Avatar,
	Center,
	Grid,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconActivity,
	IconArrowLeft,
	IconDatabaseOff,
	IconPencil,
	IconPlus,
	IconTrash,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { TimePreset } from '../_lib/types';
import { getEmployeeDetail } from '../_server/actions';
import ActivityHeatmap from './ActivityHeatmap';
import ActivityTimeline from './ActivityTimeline';
import DateRangeFilter from './DateRangeFilter';
import EntityBreakdownChart from './EntityBreakdownChart';

type Props = {
	userId: string;
	start: Date;
	end: Date;
	preset: TimePreset;
	onPresetChange: (preset: TimePreset) => void;
	onRangeChange: (range: { start: Date; end: Date }) => void;
};

type StatCardProps = {
	label: string;
	value: number;
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
				<Text fz={24} fw={700} lh={1.2}>
					{value.toLocaleString()}
				</Text>
				<Text fz='sm' c='dimmed'>
					{label}
				</Text>
			</Stack>
		</Paper>
	);
}

export default function EmployeeDetailView({
	userId,
	start,
	end,
	preset,
	onPresetChange,
	onRangeChange,
}: Props) {
	const router = useRouter();

	const { data, isLoading } = useQuery({
		queryKey: [
			'activity-tracker',
			'employee',
			userId,
			start.toISOString(),
			end.toISOString(),
		],
		queryFn: () => getEmployeeDetail(userId, start, end),
	});

	if (isLoading) {
		return (
			<Stack>
				<Skeleton h={60} />
				<SimpleGrid cols={{ base: 2, sm: 4 }}>
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={`det-skel-${i}`} h={100} />
					))}
				</SimpleGrid>
				<Grid>
					<Grid.Col span={{ base: 12, md: 6 }}>
						<Skeleton h={300} />
					</Grid.Col>
					<Grid.Col span={{ base: 12, md: 6 }}>
						<Skeleton h={300} />
					</Grid.Col>
				</Grid>
			</Stack>
		);
	}

	if (!data) {
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
					<Avatar src={data.user.image} size='md' radius='xl'>
						{data.user.name
							?.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2)
							.toUpperCase()}
					</Avatar>
					<div>
						<Title order={4}>{data.user.name ?? 'Unknown'}</Title>
						<Text fz='sm' c='dimmed'>
							{data.user.email}
						</Text>
					</div>
				</Group>
				<DateRangeFilter
					value={{ start, end }}
					onChange={onRangeChange}
					preset={preset}
					onPresetChange={onPresetChange}
				/>
			</Group>

			<SimpleGrid cols={{ base: 2, sm: 4 }}>
				<StatCard
					label='Total Operations'
					value={data.totalOperations}
					icon={<IconActivity size={20} />}
					color='blue'
				/>
				<StatCard
					label='Creates'
					value={data.operationsByType.inserts}
					icon={<IconPlus size={20} />}
					color='teal'
				/>
				<StatCard
					label='Updates'
					value={data.operationsByType.updates}
					icon={<IconPencil size={20} />}
					color='indigo'
				/>
				<StatCard
					label='Deletes'
					value={data.operationsByType.deletes}
					icon={<IconTrash size={20} />}
					color='red'
				/>
			</SimpleGrid>

			<Grid>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<EntityBreakdownChart userId={userId} start={start} end={end} />
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<ActivityHeatmap userId={userId} start={start} end={end} />
				</Grid.Col>
			</Grid>

			<ActivityTimeline userId={userId} start={start} end={end} />
		</Stack>
	);
}
