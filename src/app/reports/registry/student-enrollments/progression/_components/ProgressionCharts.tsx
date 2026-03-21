'use client';

import { BarChart, DonutChart } from '@mantine/charts';
import {
	Card,
	Center,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { formatSemester } from '@/shared/lib/utils/utils';
import { getProgressionChartData } from '../_server/actions';
import type {
	ProgressionCategory,
	ProgressionFilter,
} from '../_server/repository';

const CATEGORY_COLORS: Record<ProgressionCategory, string> = {
	Progressed: 'green.6',
	Remained: 'orange.6',
	'Not Enrolled': 'red.6',
	Graduated: 'blue.6',
	'Dropped Out': 'pink.6',
	Deferred: 'yellow.6',
	'Terminated/Suspended': 'gray.6',
};

interface Props {
	prevTermId: number | undefined;
	currTermId: number | undefined;
	filter: ProgressionFilter;
}

interface ChartTooltipProps {
	label: React.ReactNode;
	payload: Record<string, unknown>[] | undefined;
	seriesName?: string;
}

function ChartTooltip({
	label,
	payload,
	seriesName = 'Students',
}: ChartTooltipProps) {
	if (!payload || payload.length === 0) return null;

	const filtered = payload.filter(
		(item) => item.value !== undefined && item.value !== null
	);
	if (filtered.length === 0) return null;

	return (
		<Paper px='md' py='sm' withBorder shadow='md' radius='md'>
			<Text fw={500} mb={5}>
				{label}
			</Text>
			{filtered.map((item) => (
				<Text key={String(item.name)} c={String(item.color)} fz='sm'>
					{String(item.name ?? seriesName)}: {String(item.value)}
				</Text>
			))}
		</Paper>
	);
}

export default function ProgressionCharts({
	prevTermId,
	currTermId,
	filter,
}: Props) {
	const enabled = Boolean(prevTermId && currTermId);

	const { data: chartData, isLoading } = useQuery({
		queryKey: ['progression-chart-data', prevTermId, currTermId, filter],
		queryFn: async () => {
			if (!prevTermId || !currTermId) return null;
			const result = await getProgressionChartData(
				prevTermId,
				currTermId,
				filter
			);
			return result.success ? result.data : null;
		},
		enabled,
	});

	if (isLoading) {
		return (
			<SimpleGrid cols={{ base: 1, md: 2 }}>
				{[1, 2, 3, 4, 5].map((n) => (
					<Card key={`skeleton-${n}`} withBorder p='md'>
						<Skeleton height={300} />
					</Card>
				))}
			</SimpleGrid>
		);
	}

	if (!chartData) return null;

	const progressedCount =
		chartData.byCategory.find((c) => c.category === 'Progressed')?.count ?? 0;
	const totalCount = chartData.totalStudents;
	const progressionRate =
		totalCount > 0 ? Math.round((progressedCount / totalCount) * 100) : 0;

	const donutData = chartData.byCategory.map((item) => ({
		name: item.category,
		value: item.count,
		color: CATEGORY_COLORS[item.category],
	}));

	const reasonsData = chartData.byCategory
		.filter((c) => c.category !== 'Progressed')
		.map((item) => ({
			category: item.category,
			count: item.count,
		}));

	const schoolData = chartData.bySchool.map((item) => ({
		code: item.code,
		Progressed: item.progressed,
		'Not Progressed': item.notProgressed,
	}));

	const programData = chartData.byProgram.slice(0, 15).map((item) => ({
		name:
			item.name.length > 30 ? `${item.name.substring(0, 30)}...` : item.name,
		rate: item.rate,
	}));

	const semesterData = chartData.bySemester.map((item) => ({
		semester: formatSemester(item.semester, 'mini'),
		rate: item.rate,
		total: item.total,
		progressed: item.progressed,
	}));

	return (
		<SimpleGrid cols={{ base: 1, md: 2 }}>
			<Card withBorder p='md'>
				<Stack gap='md'>
					<div>
						<Title order={4}>Progression Rate</Title>
						<Text size='sm' c='dimmed'>
							{progressedCount} of {totalCount} students progressed (
							{progressionRate}%)
						</Text>
					</div>
					<Center>
						<DonutChart
							size={220}
							thickness={28}
							paddingAngle={3}
							data={donutData}
							withLabelsLine
							withLabels
							labelsType='percent'
							withTooltip
						/>
					</Center>
				</Stack>
			</Card>

			{reasonsData.length > 0 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Non-Progression Reasons</Title>
							<Text size='sm' c='dimmed'>
								{totalCount - progressedCount} students did not progress
							</Text>
						</div>
						<BarChart
							h={300}
							data={reasonsData}
							dataKey='category'
							series={[{ name: 'count', label: 'Students', color: 'red.5' }]}
							tickLine='y'
							barProps={{ radius: 4 }}
							tooltipAnimationDuration={200}
							tooltipProps={{
								content: ({ label, payload }) => (
									<ChartTooltip
										label={label}
										payload={
											payload as unknown as
												| Record<string, unknown>[]
												| undefined
										}
									/>
								),
							}}
						/>
					</Stack>
				</Card>
			)}

			{schoolData.length > 1 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Progression by School</Title>
							<Text size='sm' c='dimmed'>
								Progressed vs not progressed per school
							</Text>
						</div>
						<BarChart
							h={300}
							data={schoolData}
							dataKey='code'
							type='stacked'
							series={[
								{ name: 'Progressed', color: 'green.6' },
								{ name: 'Not Progressed', color: 'red.4' },
							]}
							tickLine='y'
							barProps={{ radius: 4 }}
							tooltipAnimationDuration={200}
							tooltipProps={{
								content: ({ label, payload }) => (
									<ChartTooltip
										label={label}
										payload={
											payload as unknown as
												| Record<string, unknown>[]
												| undefined
										}
									/>
								),
							}}
						/>
					</Stack>
				</Card>
			)}

			{programData.length > 0 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Top Programs by Progression Rate</Title>
							<Text size='sm' c='dimmed'>
								Showing up to 15 programs by progression %
							</Text>
						</div>
						<BarChart
							h={300}
							data={programData}
							dataKey='name'
							series={[
								{ name: 'rate', label: 'Progression %', color: 'teal.6' },
							]}
							tickLine='y'
							barProps={{ radius: 4 }}
							tooltipAnimationDuration={200}
							tooltipProps={{
								content: ({ label, payload }) => (
									<ChartTooltip
										label={label}
										payload={
											payload as unknown as
												| Record<string, unknown>[]
												| undefined
										}
										seriesName='Rate'
									/>
								),
							}}
						/>
					</Stack>
				</Card>
			)}

			{semesterData.length > 0 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Progression by Previous Semester</Title>
							<Text size='sm' c='dimmed'>
								Progression rate by semester level
							</Text>
						</div>
						<BarChart
							h={300}
							data={semesterData}
							dataKey='semester'
							series={[
								{ name: 'rate', label: 'Progression %', color: 'violet.6' },
							]}
							tickLine='y'
							barProps={{ radius: 4 }}
							tooltipAnimationDuration={200}
							tooltipProps={{
								content: ({ label, payload }) => (
									<ChartTooltip
										label={label}
										payload={
											payload as unknown as
												| Record<string, unknown>[]
												| undefined
										}
										seriesName='Rate'
									/>
								),
							}}
						/>
					</Stack>
				</Card>
			)}
		</SimpleGrid>
	);
}
