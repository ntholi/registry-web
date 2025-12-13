'use client';
import { BarChart, DonutChart, PieChart } from '@mantine/charts';
import {
	Box,
	Card,
	Center,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconChartBar, IconChartDonut } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMasonryLayout } from '@/shared/lib/hooks/use-masonry';
import { getDistributionData } from '../server/actions';
import type {
	DistributionReportFilter,
	DistributionResult,
	DistributionType,
} from '../types';

interface Props {
	filter: DistributionReportFilter;
	distributionType: DistributionType | null;
}

interface ChartTooltipProps {
	label: React.ReactNode;
	payload: Record<string, unknown>[] | undefined;
}

const CHART_COLORS = [
	'blue.6',
	'teal.6',
	'violet.6',
	'orange.6',
	'pink.6',
	'cyan.6',
	'green.6',
	'yellow.6',
	'red.6',
	'indigo.6',
	'lime.6',
	'grape.6',
];

export default function DistributionCharts({
	filter,
	distributionType,
}: Props) {
	const { containerRef, isLayoutReady, containerStyle, getItemStyle } =
		useMasonryLayout({ columns: 2, gap: 16 });

	const { data, isLoading, error } = useQuery({
		queryKey: ['distribution-data', distributionType, filter],
		queryFn: async () => {
			if (!filter.termIds || filter.termIds.length === 0 || !distributionType) {
				return null;
			}
			const result = await getDistributionData(
				distributionType,
				filter.termIds,
				filter
			);
			return result.success ? result.data : null;
		},
		enabled: Boolean(
			filter.termIds && filter.termIds.length > 0 && distributionType
		),
	});

	if (isLoading) {
		return (
			<Stack gap='lg'>
				<Skeleton height={400} />
				<SimpleGrid cols={{ base: 1, md: 2 }}>
					{[1, 2, 3, 4].map((num) => (
						<Skeleton key={`skeleton-${num}`} height={350} />
					))}
				</SimpleGrid>
			</Stack>
		);
	}

	if (error) {
		return (
			<Card withBorder p='xl'>
				<Text c='red'>Error loading distribution data. Please try again.</Text>
			</Card>
		);
	}

	if (!data) {
		return null;
	}

	return (
		<Stack gap='lg'>
			<OverviewSection data={data} />

			<Box
				ref={containerRef}
				style={{
					...containerStyle,
					opacity: isLayoutReady ? 1 : 0,
					transition: 'opacity 0.2s',
				}}
			>
				{data.bySchool.length > 1 && (
					<Card withBorder p='md' style={getItemStyle({ colSpan: 2 })}>
						<Stack gap='md'>
							<div>
								<Title order={4}>Distribution by School</Title>
								<Text size='sm' c='dimmed'>
									Stacked comparison across {data.bySchool.length} schools
								</Text>
							</div>
							<BarChart
								h={350}
								data={data.bySchool.slice(0, 10).map((breakdown) => {
									const row: Record<string, string | number> = {
										category: breakdown.category,
									};
									for (const point of breakdown.data) {
										row[point.name] = point.value;
									}
									return row;
								})}
								dataKey='category'
								type='default'
								series={Array.from(
									new Set(
										data.bySchool.flatMap((b) => b.data.map((d) => d.name))
									)
								).map((name, index) => ({
									name,
									color: CHART_COLORS[index % CHART_COLORS.length],
								}))}
								tickLine='y'
								barProps={{ radius: 4 }}
								withLegend
								legendProps={{ verticalAlign: 'bottom', height: 50 }}
								tooltipAnimationDuration={200}
								tooltipProps={{
									content: ({ label, payload }) => (
										<ChartTooltip
											label={label}
											payload={payload as Record<string, unknown>[] | undefined}
										/>
									),
								}}
							/>
						</Stack>
					</Card>
				)}

				{data.bySemester.length > 0 && (
					<BreakdownCard
						title='Distribution by Semester'
						data={data.bySemester}
						type='default'
						style={getItemStyle({ colSpan: 1 })}
					/>
				)}

				{data.bySemesterStatus.length > 0 && (
					<BreakdownCard
						title='By Semester Status'
						data={data.bySemesterStatus}
						type='pie'
						style={getItemStyle({ colSpan: 1 })}
					/>
				)}

				{data.byProgram.length > 0 && (
					<Card withBorder p='md' style={getItemStyle({ colSpan: 2 })}>
						<Stack gap='md'>
							<div>
								<Title order={4}>Programs</Title>
								<Text size='sm' c='dimmed'>
									{data.byProgram.length} programs with enrolled students
								</Text>
							</div>
							<BarChart
								h={350}
								data={data.byProgram.map((breakdown) => {
									const row: Record<string, string | number> = {
										category: breakdown.category,
									};
									for (const point of breakdown.data) {
										row[point.name] = point.value;
									}
									return row;
								})}
								dataKey='category'
								type='stacked'
								series={Array.from(
									new Set(
										data.byProgram.flatMap((b) => b.data.map((d) => d.name))
									)
								).map((name, index) => ({
									name,
									color: CHART_COLORS[index % CHART_COLORS.length],
								}))}
								tickLine='y'
								barProps={{ radius: 4 }}
								withLegend
								legendProps={{ verticalAlign: 'bottom', height: 50 }}
								tooltipAnimationDuration={200}
								tooltipProps={{
									content: ({ label, payload }) => (
										<ChartTooltip
											label={label}
											payload={payload as Record<string, unknown>[] | undefined}
										/>
									),
								}}
							/>
						</Stack>
					</Card>
				)}
			</Box>
		</Stack>
	);
}

function OverviewSection({ data }: { data: DistributionResult }) {
	const chartData = assignColors(data.overview);
	const total = data.total;
	const topItem = chartData[0];

	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Group justify='space-between' align='flex-start'>
					<div>
						<Title order={3}>{data.label}</Title>
						<Text size='sm' c='dimmed'>
							{total.toLocaleString()} total students
							{topItem &&
								` • Most common: ${topItem.name} (${topItem.value.toLocaleString()})`}
						</Text>
					</div>
					<IconChartDonut size={24} opacity={0.5} />
				</Group>

				<SimpleGrid cols={{ base: 1, md: 2 }} spacing='xl'>
					<Center>
						<PieChart
							size={280}
							data={chartData.slice(0, 10)}
							withLabelsLine
							withLabels
							labelsPosition='outside'
							labelsType='percent'
							withTooltip
							tooltipDataSource='segment'
							valueFormatter={(value) => {
								const percentage = ((value / total) * 100).toFixed(1);
								return `${value.toLocaleString()} (${percentage}%)`;
							}}
						/>
					</Center>

					<Stack gap='xs' justify='center'>
						{chartData.slice(0, 8).map((item) => (
							<Group key={item.name} justify='space-between'>
								<Group gap='xs'>
									<Box
										w={12}
										h={12}
										style={{
											backgroundColor: `var(--mantine-color-${item.color?.replace('.', '-')})`,
											borderRadius: 2,
										}}
									/>
									<Text size='sm'>{item.name}</Text>
								</Group>
								<Text size='sm' fw={500}>
									{item.value.toLocaleString()} (
									{((item.value / total) * 100).toFixed(1)}%)
								</Text>
							</Group>
						))}
						{chartData.length > 8 && (
							<Text size='xs' c='dimmed'>
								+{chartData.length - 8} more categories
							</Text>
						)}
					</Stack>
				</SimpleGrid>
			</Stack>
		</Card>
	);
}

function BreakdownCard({
	title,
	data,
	type,
	style,
}: {
	title: string;
	data: DistributionResult['bySchool'];
	type: 'bar' | 'donut' | 'stacked' | 'default' | 'pie';
	style?: React.CSSProperties;
}) {
	if (data.length === 0) return null;

	const allCategories = new Set<string>();
	for (const breakdown of data) {
		for (const point of breakdown.data) {
			allCategories.add(point.name);
		}
	}
	const categories = Array.from(allCategories);

	const chartData = data.slice(0, 15).map((breakdown) => {
		const row: Record<string, string | number> = {
			category: breakdown.category,
		};
		for (const cat of categories) {
			const point = breakdown.data.find((d) => d.name === cat);
			row[cat] = point?.value || 0;
		}
		return row;
	});

	const series = categories.map((cat, index) => ({
		name: cat,
		color: CHART_COLORS[index % CHART_COLORS.length],
	}));

	const topBreakdown = data[0];

	return (
		<Card withBorder p='md' style={style}>
			<Stack gap='md'>
				<Group justify='space-between' align='flex-start'>
					<div>
						<Title order={4}>{title}</Title>
						<Text size='sm' c='dimmed'>
							{data.length} {data.length === 1 ? 'category' : 'categories'}
							{topBreakdown &&
								` • Largest: ${topBreakdown.category} (${topBreakdown.total.toLocaleString()})`}
						</Text>
					</div>
					<IconChartBar size={20} opacity={0.5} />
				</Group>

				{type === 'stacked' ? (
					<BarChart
						h={350}
						data={chartData}
						dataKey='category'
						type='stacked'
						series={series}
						tickLine='y'
						barProps={{ radius: 4 }}
						withLegend
						legendProps={{ verticalAlign: 'bottom', height: 50 }}
						tooltipAnimationDuration={200}
						tooltipProps={{
							content: ({ label, payload }) => (
								<ChartTooltip
									label={label}
									payload={payload as Record<string, unknown>[] | undefined}
								/>
							),
						}}
					/>
				) : type === 'donut' ? (
					<Center>
						<DonutChart
							size={250}
							thickness={30}
							paddingAngle={3}
							data={data.slice(0, 8).map((breakdown, index) => ({
								name: breakdown.category,
								value: breakdown.total,
								color: CHART_COLORS[index % CHART_COLORS.length],
							}))}
							withLabelsLine
							withLabels
							labelsType='percent'
							withTooltip
							tooltipDataSource='segment'
							valueFormatter={(value) => {
								const total = data
									.slice(0, 8)
									.reduce((sum, b) => sum + b.total, 0);
								const percentage = ((value / total) * 100).toFixed(1);
								return `${value.toLocaleString()} (${percentage}%)`;
							}}
						/>
					</Center>
				) : type === 'pie' ? (
					<Center>
						<PieChart
							size={230}
							data={data.slice(0, 8).map((breakdown, index) => ({
								name: breakdown.category,
								value: breakdown.total,
								color: CHART_COLORS[index % CHART_COLORS.length],
							}))}
							withLabelsLine
							withLabels
							labelsPosition='outside'
							labelsType='percent'
							withTooltip
							tooltipDataSource='segment'
							valueFormatter={(value) => {
								const total = data
									.slice(0, 8)
									.reduce((sum, b) => sum + b.total, 0);
								const percentage = ((value / total) * 100).toFixed(1);
								return `${value.toLocaleString()} (${percentage}%)`;
							}}
						/>
					</Center>
				) : type === 'default' ? (
					<BarChart
						h={350}
						data={chartData}
						dataKey='category'
						type='default'
						series={series}
						tickLine='y'
						barProps={{ radius: 4 }}
						withLegend
						legendProps={{ verticalAlign: 'bottom', height: 50 }}
						tooltipAnimationDuration={200}
						tooltipProps={{
							content: ({ label, payload }) => (
								<ChartTooltip
									label={label}
									payload={payload as Record<string, unknown>[] | undefined}
								/>
							),
						}}
					/>
				) : (
					<BarChart
						h={300}
						data={data.slice(0, 15).map((breakdown, index) => ({
							category: breakdown.category,
							count: breakdown.total,
							color: CHART_COLORS[index % CHART_COLORS.length],
						}))}
						dataKey='category'
						series={[{ name: 'count', label: 'Students', color: 'blue.6' }]}
						tickLine='y'
						barProps={{ radius: 4 }}
						tooltipAnimationDuration={200}
						tooltipProps={{
							content: ({ label, payload }) => (
								<ChartTooltip
									label={label}
									payload={payload as Record<string, unknown>[] | undefined}
								/>
							),
						}}
					/>
				)}
			</Stack>
		</Card>
	);
}

function ChartTooltip({ label, payload }: ChartTooltipProps) {
	if (!payload || payload.length === 0) return null;

	const filteredPayload = payload.filter(
		(item) => item.value !== undefined && item.value !== null
	);

	if (filteredPayload.length === 0) return null;

	const total = filteredPayload.reduce(
		(sum, item) => sum + (Number(item.value) || 0),
		0
	);

	return (
		<Paper px='md' py='sm' withBorder shadow='md' radius='md'>
			<Text fw={500} mb={5}>
				{label}
			</Text>
			{filteredPayload.map((item) => {
				const value = Number(item.value) || 0;
				const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
				return (
					<Text key={String(item.name)} c={String(item.color)} fz='sm'>
						{String(item.name)}: {value.toLocaleString()} ({percentage}%)
					</Text>
				);
			})}
		</Paper>
	);
}

function assignColors(
	data: Array<{ name: string; value: number; color?: string }>
) {
	return data.map((item, index) => ({
		...item,
		color: item.color || CHART_COLORS[index % CHART_COLORS.length],
	}));
}
