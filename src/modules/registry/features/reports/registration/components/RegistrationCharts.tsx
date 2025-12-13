'use client';
import { BarChart, DonutChart, LineChart, PieChart } from '@mantine/charts';
import {
	Box,
	Card,
	Center,
	Paper,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMasonryLayout } from '@/shared/lib/hooks/use-masonry';
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
	const { containerRef, isLayoutReady, containerStyle, getItemStyle } =
		useMasonryLayout({ columns: 2, gap: 16 });

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
			<Box ref={containerRef} style={containerStyle}>
				{[1, 2, 3, 4, 5, 6].map((num) => (
					<Card key={`skeleton-${num}`} withBorder p='md'>
						<Skeleton height={300} />
					</Card>
				))}
			</Box>
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

	const totalStudents = programsData.reduce((sum, item) => sum + item.count, 0);
	const largestProgram = programsData.reduce(
		(max, item) => (item.count > max.count ? item : max),
		programsData[0]
	);

	const genderData = chartData.studentsByGender.map((item) => ({
		...item,
		count: Number(item.count),
	}));
	const maleCount = genderData.find((g) => g.gender === 'Male')?.count || 0;
	const femaleCount = genderData.find((g) => g.gender === 'Female')?.count || 0;
	const genderRatio =
		maleCount && femaleCount
			? maleCount > femaleCount
				? `${(maleCount / femaleCount).toFixed(1)}:1 M:F`
				: `1:${(femaleCount / maleCount).toFixed(1)} M:F`
			: '';

	const ageData = chartData.studentsByAge.map((item) => ({
		age: Number(item.age),
		count: Number(item.count),
	}));
	const minAge =
		ageData.length > 0 ? Math.min(...ageData.map((a) => a.age)) : 0;
	const maxAge =
		ageData.length > 0 ? Math.max(...ageData.map((a) => a.age)) : 0;
	const mostCommonAge =
		ageData.length > 0
			? ageData.reduce((max, item) => (item.count > max.count ? item : max)).age
			: 0;

	const schoolData = chartData.studentsBySchool.map((item) => ({
		...item,
		count: Number(item.count),
	}));
	const largestSchool =
		schoolData.length > 0
			? schoolData.reduce((max, item) => (item.count > max.count ? item : max))
			: null;

	const semesterData = studentsBySemester.map((item) => ({
		...item,
		count: Number(item.count),
	}));
	const mostPopularSemester =
		semesterData.length > 0
			? semesterData.reduce((max, item) =>
					item.count > max.count ? item : max
				)
			: null;

	const sponsorData = chartData.studentsBySponsor.map((item) => ({
		...item,
		count: Number(item.count),
	}));
	const topSponsor =
		sponsorData.length > 0
			? sponsorData.reduce((max, item) => (item.count > max.count ? item : max))
			: null;

	const countryData = chartData.studentsByCountry.map((item) => ({
		...item,
		count: Number(item.count),
	}));
	const topCountry =
		countryData.length > 0
			? countryData.reduce((max, item) => (item.count > max.count ? item : max))
			: null;

	const levelLabels: Record<string, string> = {
		certificate: 'Certificate',
		diploma: 'Diploma',
		degree: 'Degree',
		Unknown: 'Unknown',
	};
	const programLevelData = chartData.studentsByProgramLevel.map((item) => ({
		level: item.level,
		label: levelLabels[item.level] || item.level,
		count: Number(item.count),
	}));
	const topProgramLevel =
		programLevelData.length > 0
			? programLevelData.reduce((max, item) =>
					item.count > max.count ? item : max
				)
			: null;

	return (
		<Box
			ref={containerRef}
			style={{
				...containerStyle,
				opacity: isLayoutReady ? 1 : 0,
				transition: 'opacity 0.2s',
			}}
		>
			<Card
				withBorder
				p='md'
				style={getItemStyle({ colSpan: programsData.length > 10 ? 2 : 1 })}
			>
				<Stack gap='md'>
					<div>
						<Title order={4}>Programs</Title>
						<Text size='sm' c='dimmed'>
							{totalStudents} students across {programsData.length}{' '}
							{programsData.length === 1 ? 'program' : 'programs'}
							{largestProgram &&
								` • Largest: ${largestProgram.code} (${largestProgram.count})`}
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
			{chartData.studentsBySchool.length > 1 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Students by School</Title>
							<Text size='sm' c='dimmed'>
								{chartData.studentsBySchool.length}{' '}
								{chartData.studentsBySchool.length === 1 ? 'school' : 'schools'}
								{largestSchool &&
									` • Largest: ${largestSchool.code} (${largestSchool.count} students)`}
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
			)}

			<Card withBorder p='md'>
				<Stack gap='md'>
					<div>
						<Title order={4}>Students by Semester</Title>
						<Text size='sm' c='dimmed'>
							{studentsBySemester.length}{' '}
							{studentsBySemester.length === 1 ? 'semester' : 'semesters'}
							{mostPopularSemester &&
								` • Most common: ${mostPopularSemester.semesterLabel} (${mostPopularSemester.count} students)`}
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

			<Card withBorder p='md'>
				<Stack gap='md'>
					<div>
						<Title order={4}>Gender Distribution</Title>
						<Text size='sm' c='dimmed'>
							{maleCount} Male, {femaleCount} Female
							{genderRatio && ` • Ratio: ${genderRatio}`}
						</Text>
					</div>
					<Center>
						<PieChart
							size={220}
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

			{programLevelData.length > 0 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Program Level</Title>
							<Text size='sm' c='dimmed'>
								{programLevelData.length}{' '}
								{programLevelData.length === 1 ? 'level' : 'levels'}
								{topProgramLevel &&
									` • Most common: ${topProgramLevel.label} (${topProgramLevel.count})`}
							</Text>
						</div>
						<Center>
							<PieChart
								size={220}
								data={programLevelData.map((item) => {
									const levelColors: Record<string, string> = {
										certificate: 'teal.6',
										diploma: 'blue.6',
										degree: 'violet.6',
										Unknown: 'gray.6',
									};
									return {
										name: item.label,
										value: item.count,
										color: levelColors[item.level] || 'gray.6',
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
			)}

			{chartData.programsBySchool.length > 1 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Programs per School</Title>
							<Text size='sm' c='dimmed'>
								{chartData.programsBySchool.length}{' '}
								{chartData.programsBySchool.length === 1 ? 'school' : 'schools'}{' '}
								with active programs
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
			)}

			<Card withBorder p='md'>
				<Stack gap='md'>
					<div>
						<Title order={4}>Sponsors</Title>
						<Text size='sm' c='dimmed'>
							{chartData.studentsBySponsor.length}{' '}
							{chartData.studentsBySponsor.length === 1
								? 'sponsor'
								: 'sponsors'}
							{topSponsor &&
								` • Top: ${topSponsor.sponsor.length > 25 ? `${topSponsor.sponsor.substring(0, 25)}...` : topSponsor.sponsor} (${topSponsor.count})`}
						</Text>
					</div>
					<Center>
						<DonutChart
							size={220}
							thickness={28}
							paddingAngle={4}
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
										item.sponsor.length > 25
											? `${item.sponsor.substring(0, 25)}...`
											: item.sponsor,
									value: Number(item.count),
									color: colors[index % colors.length],
								};
							})}
							withLabelsLine
							withLabels
							labelsType='percent'
							withTooltip
						/>
					</Center>
				</Stack>
			</Card>

			{chartData.studentsByAge.length > 0 && (
				<Card withBorder p='md' style={getItemStyle({ colSpan: 2 })}>
					<Stack gap='md'>
						<div>
							<Title order={4}>Age Distribution</Title>
							<Text size='sm' c='dimmed'>
								Range: {minAge}-{maxAge} years • Most common: {mostCommonAge}{' '}
								years
							</Text>
						</div>
						<LineChart
							h={300}
							data={chartData.studentsByAge}
							dataKey='age'
							series={[{ name: 'count', label: 'Students', color: 'teal.6' }]}
							curveType='natural'
							tickLine='y'
							tooltipAnimationDuration={200}
							tooltipProps={{
								content: ({ label, payload }) => (
									<ChartTooltip
										label={`Age ${label}`}
										payload={payload as Record<string, unknown>[] | undefined}
									/>
								),
							}}
						/>
					</Stack>
				</Card>
			)}

			<Card withBorder p='md'>
				<Stack gap='md'>
					<div>
						<Title order={4}>Semester Status</Title>
						<Text size='sm' c='dimmed'>
							{chartData.studentsBySemesterStatus.length}{' '}
							{chartData.studentsBySemesterStatus.length === 1
								? 'status'
								: 'statuses'}
						</Text>
					</div>
					<Center>
						<PieChart
							size={220}
							data={chartData.studentsBySemesterStatus.map((item, index) => {
								const statusColors: Record<string, string> = {
									Active: 'green.6',
									Repeat: 'yellow.6',
									Deferred: 'blue.6',
									DroppedOut: 'red.6',
									Completed: 'teal.6',
									Unknown: 'gray.6',
								};
								const fallbackColors = [
									'violet.6',
									'orange.6',
									'cyan.6',
									'pink.6',
								];
								return {
									name:
										item.status === 'DroppedOut' ? 'Dropped Out' : item.status,
									value: Number(item.count),
									color:
										statusColors[item.status] ||
										fallbackColors[index % fallbackColors.length],
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

			{chartData.studentsByCountry.length > 0 && (
				<Card
					withBorder
					p='md'
					style={getItemStyle({
						colSpan: chartData.studentsByCountry.length > 10 ? 2 : 1,
					})}
				>
					<Stack gap='md'>
						<div>
							<Title order={4}>Students by Country</Title>
							<Text size='sm' c='dimmed'>
								{chartData.studentsByCountry.length}{' '}
								{chartData.studentsByCountry.length === 1
									? 'country'
									: 'countries'}
								{topCountry &&
									` • Top: ${topCountry.country} (${topCountry.count})`}
								{chartData.studentsByCountry.length > 15 && ' • Showing top 15'}
							</Text>
						</div>
						<BarChart
							h={300}
							data={chartData.studentsByCountry.slice(0, 15)}
							dataKey='country'
							series={[{ name: 'count', label: 'Students', color: 'cyan.6' }]}
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
			)}
		</Box>
	);
}
