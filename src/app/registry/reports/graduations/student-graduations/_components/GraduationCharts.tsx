'use client';
import { BarChart, DonutChart, PieChart } from '@mantine/charts';
import { Card, Grid, Group, Loader, Stack, Text } from '@mantine/core';
import {
	IconChartBar,
	IconChartDonut,
	IconChartPie,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getGraduationChartData } from '../_server/actions';
import type { GraduationReportFilter } from './Filter';

interface Props {
	filter: GraduationReportFilter;
}

export default function GraduationCharts({ filter }: Props) {
	const { data: chartData, isLoading } = useQuery({
		queryKey: ['graduation-chart-data', filter],
		queryFn: async () => {
			if (!filter.graduationDate) return null;
			const result = await getGraduationChartData(filter);
			return result.success ? result.data : null;
		},
		enabled: Boolean(filter.graduationDate),
	});

	if (isLoading) {
		return (
			<Card withBorder p='xl'>
				<Stack align='center' gap='md' py='xl'>
					<Loader size='lg' />
					<Text c='dimmed'>Loading chart data...</Text>
				</Stack>
			</Card>
		);
	}

	if (!chartData) {
		return (
			<Card withBorder p='xl'>
				<Text c='dimmed' ta='center'>
					No chart data available. Please select filters to generate charts.
				</Text>
			</Card>
		);
	}

	const schoolChartData = chartData.graduatesBySchool.map((item) => ({
		name: item.code,
		value: item.count,
		graduates: item.count,
	}));

	const levelChartData = chartData.graduatesByLevel.map(
		(item, index: number) => {
			const colors = [
				'blue',
				'green',
				'orange',
				'violet',
				'pink',
				'teal',
				'cyan',
			];
			return {
				name: item.level,
				value: item.count,
				color: colors[index % colors.length],
			};
		}
	);

	const genderChartData = chartData.graduatesByGender.map(
		(item: { gender: string; count: number }) => {
			const color =
				item.gender === 'Male'
					? 'blue'
					: item.gender === 'Female'
						? 'pink'
						: 'gray';
			return {
				name: item.gender,
				value: item.count,
				color,
			};
		}
	);

	return (
		<Grid gutter='md'>
			<Grid.Col span={{ base: 12, lg: 6 }}>
				<Card withBorder p='md' h='100%'>
					<Stack gap='md'>
						<Group>
							<IconChartBar size={24} />
							<Text fw={600} size='lg'>
								Graduates by School
							</Text>
						</Group>
						{schoolChartData.length > 0 ? (
							<BarChart
								h={300}
								data={schoolChartData}
								dataKey='name'
								series={[
									{ name: 'graduates', label: 'Graduates', color: 'blue' },
								]}
								tickLine='y'
								gridAxis='y'
							/>
						) : (
							<Text c='dimmed' ta='center' py='xl'>
								No data available
							</Text>
						)}
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, lg: 6 }}>
				<Card withBorder p='md' h='100%'>
					<Stack gap='md'>
						<Group>
							<IconChartDonut size={24} />
							<Text fw={600} size='lg'>
								Graduates by Program Level
							</Text>
						</Group>
						{levelChartData.length > 0 ? (
							<DonutChart
								h={300}
								data={levelChartData}
								withLabelsLine
								withLabels
								chartLabel='Graduates'
							/>
						) : (
							<Text c='dimmed' ta='center' py='xl'>
								No data available
							</Text>
						)}
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, lg: 6 }}>
				<Card withBorder p='md' h='100%'>
					<Stack gap='md'>
						<Group>
							<IconChartPie size={24} />
							<Text fw={600} size='lg'>
								Graduates by Gender
							</Text>
						</Group>
						{genderChartData.length > 0 ? (
							<PieChart
								h={300}
								data={genderChartData}
								withLabelsLine
								withLabels
								labelsType='percent'
							/>
						) : (
							<Text c='dimmed' ta='center' py='xl'>
								No data available
							</Text>
						)}
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, lg: 6 }}>
				<Card withBorder p='md' h='100%'>
					<Stack gap='md'>
						<Group>
							<IconChartBar size={24} />
							<Text fw={600} size='lg'>
								Top Programs by Graduates
							</Text>
						</Group>
						{chartData.graduatesByProgram.length > 0 ? (
							<BarChart
								h={300}
								data={chartData.graduatesByProgram
									.slice(0, 10)
									.map(
										(item: {
											name: string;
											code: string;
											count: number;
											school: string;
										}) => ({
											name: item.code,
											value: item.count,
											graduates: item.count,
										})
									)}
								dataKey='name'
								series={[
									{ name: 'graduates', label: 'Graduates', color: 'green' },
								]}
								tickLine='y'
								gridAxis='y'
							/>
						) : (
							<Text c='dimmed' ta='center' py='xl'>
								No data available
							</Text>
						)}
					</Stack>
				</Card>
			</Grid.Col>
		</Grid>
	);
}
