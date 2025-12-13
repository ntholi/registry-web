'use client';
import { BarChart, PieChart } from '@mantine/charts';
import {
	Card,
	Center,
	Grid,
	Paper,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { formatSemester } from '@/shared/lib/utils/utils';
import { getRegistrationChartData } from '../server/actions';
import type { ReportFilter } from './RegistrationFilter';

interface RegistrationChartsProps {
	filter: ReportFilter;
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

	const filteredPayload = payload.filter(
		(item) => item.value !== undefined && item.value !== null
	);

	if (filteredPayload.length === 0) return null;

	return (
		<Paper px='md' py='sm' withBorder shadow='md' radius='md'>
			<Text fw={500} mb={5}>
				{label}
			</Text>
			{filteredPayload.map((item) => (
				<Text key={String(item.name)} c={String(item.color)} fz='sm'>
					{seriesName}: {String(item.value)}
				</Text>
			))}
		</Paper>
	);
}

interface ProgramData {
	name: string;
	code: string;
	count: number;
	school: string;
}

export default function RegistrationCharts({
	filter,
}: RegistrationChartsProps) {
	const { data: chartData, isLoading } = useQuery({
		queryKey: ['registration-chart-data', filter],
		queryFn: async () => {
			if (!filter.termIds || filter.termIds.length === 0) return null;
			const result = await getRegistrationChartData(filter.termIds, filter);
			return result.success ? result.data : null;
		},
		enabled: Boolean(filter.termIds && filter.termIds.length > 0),
	});

	if (isLoading) {
		return (
			<Grid>
				{[1, 2, 3, 4, 5, 6].map((num) => (
					<Grid.Col key={`skeleton-${num}`} span={{ base: 12, md: 6 }}>
						<Card withBorder p='md'>
							<Skeleton height={300} />
						</Card>
					</Grid.Col>
				))}
			</Grid>
		);
	}

	if (!chartData) {
		return null;
	}

	const studentsBySemester = chartData.studentsBySemester.map((item) => ({
		...item,
		semesterLabel: formatSemester(item.semester, 'mini'),
	}));

	const programsData: ProgramData[] = (
		chartData.studentsByProgram as ProgramData[]
	).map((item) => ({
		...item,
		count: Number(item.count),
	}));

	return (
		<Grid>
			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Students by School</Title>
							<Text size='sm' c='dimmed'>
								Distribution of students across schools
							</Text>
						</div>
						<BarChart
							h={300}
							data={chartData.studentsBySchool}
							dataKey='code'
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
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Students by Semester</Title>
							<Text size='sm' c='dimmed'>
								Distribution across academic levels
							</Text>
						</div>
						<BarChart
							h={300}
							data={studentsBySemester}
							dataKey='semesterLabel'
							series={[{ name: 'count', label: 'Students', color: 'green.6' }]}
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
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Gender Distribution</Title>
							<Text size='sm' c='dimmed'>
								Student enrollment by gender
							</Text>
						</div>
						<Center>
							<PieChart
								h={300}
								w={300}
								data={chartData.studentsByGender.map((item) => ({
									name: item.gender,
									value: Number(item.count),
									color:
										item.gender === 'Male'
											? 'blue.6'
											: item.gender === 'Female'
												? 'pink.6'
												: 'gray.6',
								}))}
								withLabelsLine
								withLabels
								labelsPosition='outside'
								labelsType='percent'
								withTooltip
							/>
						</Center>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Top Programs</Title>
							<Text size='sm' c='dimmed'>
								Top 10 programs by enrollment
							</Text>
						</div>
						<BarChart
							h={300}
							data={programsData}
							dataKey='code'
							series={[{ name: 'count', label: 'Students', color: 'orange.6' }]}
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
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Programs per School</Title>
							<Text size='sm' c='dimmed'>
								Number of active programs in each school
							</Text>
						</div>
						<BarChart
							h={300}
							data={chartData.programsBySchool}
							dataKey='schoolCode'
							series={[
								{
									name: 'programCount',
									label: 'Programs',
									color: 'violet.6',
								},
							]}
							tickLine='y'
							barProps={{ radius: 4 }}
							tooltipAnimationDuration={200}
							tooltipProps={{
								content: ({ label, payload }) => (
									<ChartTooltip
										label={label}
										payload={payload as Record<string, unknown>[] | undefined}
										seriesName='Programs'
									/>
								),
							}}
						/>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Top Sponsors</Title>
							<Text size='sm' c='dimmed'>
								Top 5 sponsors by student count
							</Text>
						</div>
						<Center>
							<PieChart
								h={300}
								data={chartData.studentsBySponsor.map((item, index) => {
									const colors = [
										'blue.6',
										'green.6',
										'yellow.6',
										'orange.6',
										'violet.6',
										'cyan.6',
										'pink.6',
										'teal.6',
									];
									return {
										name:
											item.sponsor.length > 30
												? `${item.sponsor.substring(0, 30)}...`
												: item.sponsor,
										value: Number(item.count),
										color: colors[index % colors.length],
									};
								})}
								withLabelsLine
								withLabels
								labelsPosition='outside'
								labelsType='percent'
								withTooltip
							/>
						</Center>
					</Stack>
				</Card>
			</Grid.Col>
		</Grid>
	);
}
