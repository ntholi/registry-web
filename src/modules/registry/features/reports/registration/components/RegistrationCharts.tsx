'use client';
import { BarChart, PieChart } from '@mantine/charts';
import { Card, Grid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { formatSemester } from '@/shared/lib/utils/utils';
import { getRegistrationChartData } from '../server/actions';
import type { ReportFilter } from './RegistrationFilter';

interface RegistrationChartsProps {
	filter: ReportFilter;
}

function hasAtLeastTwoNonZero(
	data: ReadonlyArray<Record<string, unknown>> | null | undefined,
	valueKey: string
): boolean {
	if (!Array.isArray(data)) return false;
	let nonZeroCount = 0;
	for (const item of data) {
		const value = item[valueKey];
		const isNonZero =
			typeof value === 'number'
				? value > 0
				: typeof value === 'bigint'
					? Number(value) > 0
					: Boolean(value);
		if (isNonZero) nonZeroCount += 1;
		if (nonZeroCount >= 2) return true;
	}
	return false;
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

	const showStudentsBySchool = hasAtLeastTwoNonZero(
		chartData.studentsBySchool,
		'count'
	);
	const showStudentsBySemester = hasAtLeastTwoNonZero(
		chartData.studentsBySemester,
		'count'
	);
	const showStudentsByGender = hasAtLeastTwoNonZero(
		chartData.studentsByGender,
		'count'
	);
	const showStudentsByProgram = hasAtLeastTwoNonZero(
		chartData.studentsByProgram,
		'count'
	);
	const showProgramsBySchool = hasAtLeastTwoNonZero(
		chartData.programsBySchool,
		'programCount'
	);
	const showStudentsBySponsor = hasAtLeastTwoNonZero(
		chartData.studentsBySponsor,
		'count'
	);

	const studentsBySemester = chartData.studentsBySemester.map((item) => ({
		...item,
		semesterLabel: formatSemester(item.semester, 'mini'),
	}));

	return (
		<Grid>
			{showStudentsBySchool ? (
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
							/>
						</Stack>
					</Card>
				</Grid.Col>
			) : null}

			{showStudentsBySemester ? (
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
								series={[
									{ name: 'count', label: 'Students', color: 'green.6' },
								]}
								tickLine='y'
								barProps={{ radius: 4 }}
							/>
						</Stack>
					</Card>
				</Grid.Col>
			) : null}

			{showStudentsByGender ? (
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Card withBorder p='md'>
						<Stack gap='md'>
							<div>
								<Title order={4}>Gender Distribution</Title>
								<Text size='sm' c='dimmed'>
									Student enrollment by gender
								</Text>
							</div>
							<PieChart
								h={300}
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
						</Stack>
					</Card>
				</Grid.Col>
			) : null}

			{showStudentsByProgram ? (
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
								data={chartData.studentsByProgram}
								dataKey='code'
								orientation='vertical'
								series={[
									{ name: 'count', label: 'Students', color: 'orange.6' },
								]}
								yAxisProps={{ width: 80 }}
								barProps={{ radius: 4 }}
								tooltipProps={{
									content: ({ payload }) => {
										if (!payload || payload.length === 0) return null;
										const item = payload[0];
										const programCode = item.payload?.code;
										const count = item.value;
										return (
											<Card withBorder p='xs' radius='sm'>
												<Text fw={500}>{programCode}</Text>
												<Text size='sm' c='dimmed'>
													Students: {count}
												</Text>
											</Card>
										);
									},
								}}
							/>
						</Stack>
					</Card>
				</Grid.Col>
			) : null}

			{showProgramsBySchool ? (
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
								xAxisProps={{ angle: -45 }}
								barProps={{ radius: 4 }}
							/>
						</Stack>
					</Card>
				</Grid.Col>
			) : null}

			{showStudentsBySponsor ? (
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Card withBorder p='md'>
						<Stack gap='md'>
							<div>
								<Title order={4}>Top Sponsors</Title>
								<Text size='sm' c='dimmed'>
									Top 5 sponsors by student count
								</Text>
							</div>
							<PieChart
								h={380}
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
						</Stack>
					</Card>
				</Grid.Col>
			) : null}
		</Grid>
	);
}
