'use client';
import {
	Card,
	Grid,
	Group,
	Skeleton,
	Stack,
	Text,
	Title,
	useMantineTheme,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { getRegistrationChartData } from '@/modules/registry/features/reports/registration/server/actions';
import { formatSemester } from '@/shared/lib/utils/utils';
import type { ReportFilter } from './RegistrationFilter';

interface RegistrationChartsProps {
	filter: ReportFilter;
}

const COLORS = [
	'#228be6',
	'#40c057',
	'#fab005',
	'#fd7e14',
	'#be4bdb',
	'#15aabf',
	'#e64980',
	'#82c91e',
];

export default function RegistrationCharts({
	filter,
}: RegistrationChartsProps) {
	const theme = useMantineTheme();

	const { data: chartData, isLoading } = useQuery({
		queryKey: ['registration-chart-data', filter],
		queryFn: async () => {
			if (!filter.termId) return null;
			const result = await getRegistrationChartData(filter.termId, filter);
			return result.success ? result.data : null;
		},
		enabled: Boolean(filter.termId),
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

	return (
		<Grid>
			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<Group justify='space-between'>
							<div>
								<Title order={4}>Students by School</Title>
								<Text size='sm' c='dimmed'>
									Distribution of students across schools
								</Text>
							</div>
						</Group>
						<ResponsiveContainer width='100%' height={300}>
							<BarChart data={chartData.studentsBySchool}>
								<CartesianGrid
									strokeDasharray='3 3'
									stroke={theme.colors.gray[3]}
								/>
								<XAxis
									dataKey='code'
									stroke={theme.colors.gray[6]}
									style={{ fontSize: '12px' }}
								/>
								<YAxis stroke={theme.colors.gray[6]} />
								<Tooltip
									contentStyle={{
										backgroundColor: theme.colors.dark[7],
										border: `1px solid ${theme.colors.dark[4]}`,
										borderRadius: '4px',
									}}
									labelStyle={{ color: theme.colors.gray[0] }}
								/>
								<Bar
									dataKey='count'
									fill={theme.colors.blue[6]}
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<Group justify='space-between'>
							<div>
								<Title order={4}>Students by Semester</Title>
								<Text size='sm' c='dimmed'>
									Distribution across academic levels
								</Text>
							</div>
						</Group>
						<ResponsiveContainer width='100%' height={300}>
							<BarChart
								data={chartData.studentsBySemester.map((item) => ({
									...item,
									semesterLabel: formatSemester(item.semester, 'mini'),
								}))}
							>
								<CartesianGrid
									strokeDasharray='3 3'
									stroke={theme.colors.gray[3]}
								/>
								<XAxis
									dataKey='semesterLabel'
									stroke={theme.colors.gray[6]}
									style={{ fontSize: '12px' }}
								/>
								<YAxis stroke={theme.colors.gray[6]} />
								<Tooltip
									contentStyle={{
										backgroundColor: theme.colors.dark[7],
										border: `1px solid ${theme.colors.dark[4]}`,
										borderRadius: '4px',
									}}
									labelStyle={{ color: theme.colors.gray[0] }}
								/>
								<Bar
									dataKey='count'
									fill={theme.colors.green[6]}
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<Group justify='space-between'>
							<div>
								<Title order={4}>Gender Distribution</Title>
								<Text size='sm' c='dimmed'>
									Student enrollment by gender
								</Text>
							</div>
						</Group>
						<ResponsiveContainer width='100%' height={300}>
							<PieChart>
								<Pie
									data={chartData.studentsByGender}
									cx='50%'
									cy='50%'
									labelLine={false}
									label={({ percent }) =>
										percent && percent > 0.05
											? `${(percent * 100).toFixed(0)}%`
											: ''
									}
									outerRadius={100}
									fill='#8884d8'
									dataKey='count'
									nameKey='gender'
								>
									{chartData.studentsByGender.map((entry, index) => (
										<Cell
											key={`cell-${entry.gender}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: theme.colors.gray[0],
										border: `1px solid ${theme.colors.dark[4]}`,
										borderRadius: '4px',
										color: theme.colors.dark[9],
									}}
								/>
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<Group justify='space-between'>
							<div>
								<Title order={4}>Top Programs</Title>
								<Text size='sm' c='dimmed'>
									Top 10 programs by enrollment
								</Text>
							</div>
						</Group>
						<ResponsiveContainer width='100%' height={300}>
							<BarChart
								data={chartData.studentsByProgram}
								layout='vertical'
								margin={{ left: 10, right: 10 }}
							>
								<CartesianGrid
									strokeDasharray='3 3'
									stroke={theme.colors.gray[3]}
								/>
								<XAxis type='number' stroke={theme.colors.gray[6]} />
								<YAxis
									dataKey='code'
									type='category'
									stroke={theme.colors.gray[6]}
									width={80}
									style={{ fontSize: '11px' }}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: theme.colors.dark[7],
										border: `1px solid ${theme.colors.dark[4]}`,
										borderRadius: '4px',
									}}
									labelFormatter={(value, payload) => {
										if (payload && payload.length > 0) {
											return payload[0].payload.name;
										}
										return value;
									}}
								/>
								<Bar
									dataKey='count'
									fill={theme.colors.orange[6]}
									radius={[0, 4, 4, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<Group justify='space-between'>
							<div>
								<Title order={4}>Programs per School</Title>
								<Text size='sm' c='dimmed'>
									Number of active programs in each school
								</Text>
							</div>
						</Group>
						<ResponsiveContainer width='100%' height={300}>
							<BarChart data={chartData.programsBySchool}>
								<CartesianGrid
									strokeDasharray='3 3'
									stroke={theme.colors.gray[3]}
								/>
								<XAxis
									dataKey='schoolCode'
									stroke={theme.colors.gray[6]}
									style={{ fontSize: '11px' }}
									angle={-45}
									textAnchor='end'
									height={80}
								/>
								<YAxis stroke={theme.colors.gray[6]} />
								<Tooltip
									contentStyle={{
										backgroundColor: theme.colors.dark[7],
										border: `1px solid ${theme.colors.dark[4]}`,
										borderRadius: '4px',
									}}
									labelFormatter={(value, payload) => {
										if (payload && payload.length > 0) {
											return payload[0].payload.school;
										}
										return value;
									}}
								/>
								<Bar
									dataKey='programCount'
									fill={theme.colors.violet[6]}
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 6 }}>
				<Card withBorder p='md'>
					<Stack gap='md'>
						<Group justify='space-between'>
							<div>
								<Title order={4}>Top Sponsors</Title>
								<Text size='sm' c='dimmed'>
									Top 5 sponsors by student count
								</Text>
							</div>
						</Group>
						<ResponsiveContainer width='100%' height={300}>
							<PieChart>
								<Pie
									data={chartData.studentsBySponsor}
									cx='50%'
									cy='50%'
									labelLine={false}
									label={({ percent }) =>
										percent && percent > 0.05
											? `${(percent * 100).toFixed(0)}%`
											: ''
									}
									outerRadius={100}
									fill='#8884d8'
									dataKey='count'
									nameKey='sponsor'
								>
									{chartData.studentsBySponsor.map((entry, index) => (
										<Cell
											key={`cell-${entry.sponsor}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: theme.colors.gray[0],
										border: `1px solid ${theme.colors.dark[4]}`,
										borderRadius: '4px',
										color: theme.colors.dark[9],
									}}
								/>
								<Legend
									wrapperStyle={{ fontSize: '12px' }}
									formatter={(value) => {
										const maxLength = 30;
										return value.length > maxLength
											? `${value.substring(0, maxLength)}...`
											: value;
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
					</Stack>
				</Card>
			</Grid.Col>
		</Grid>
	);
}
