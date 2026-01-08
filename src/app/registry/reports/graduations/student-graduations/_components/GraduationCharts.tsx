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
import {
	type GenderType,
	getGenderColor,
	getProgramLevelColor,
	type ProgramLevelType,
} from '@/shared/lib/utils/colors';
import type { GraduationReportFilter } from '../_lib/types';
import { getGraduationChartData } from '../_server/actions';

interface Props {
	filter: GraduationReportFilter;
}

interface ChartTooltipProps {
	label: React.ReactNode;
	payload: Record<string, unknown>[] | undefined;
	seriesName?: string;
}

function ChartTooltip({
	label,
	payload,
	seriesName = 'Graduates',
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

export default function GraduationCharts({ filter }: Props) {
	const { containerRef, isLayoutReady, containerStyle, getItemStyle } =
		useMasonryLayout({ columns: 2, gap: 16 });

	const { data: chartData, isLoading } = useQuery({
		queryKey: ['graduation-chart-data', filter],
		queryFn: async () => {
			const result = await getGraduationChartData(filter);
			return result.success ? result.data : null;
		},
		enabled: Boolean(filter.graduationMonth),
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

	const programsData: ProgramData[] = chartData.graduatesByProgram.map(
		(item) => ({
			name: item.name,
			code: item.code,
			count: Number(item.count),
			school: item.school,
		})
	);

	const totalGraduates = programsData.reduce(
		(sum, item) => sum + item.count,
		0
	);
	const largestProgram = programsData.reduce(
		(max: ProgramData, item: ProgramData) =>
			item.count > max.count ? item : max,
		programsData[0]
	);

	const genderData = chartData.graduatesByGender.map((item) => ({
		gender: item.gender,
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

	const ageData = chartData.graduatesByAge.map((item) => ({
		age: Number(item.age),
		count: Number(item.count),
	}));
	const minAge =
		ageData.length > 0
			? Math.min(...ageData.map((a: { age: number }) => a.age))
			: 0;
	const maxAge =
		ageData.length > 0
			? Math.max(...ageData.map((a: { age: number }) => a.age))
			: 0;
	const mostCommonAge =
		ageData.length > 0
			? ageData.reduce(
					(
						max: { age: number; count: number },
						item: { age: number; count: number }
					) => (item.count > max.count ? item : max)
				).age
			: 0;

	const schoolData = chartData.graduatesBySchool.map((item) => ({
		name: item.name,
		code: item.code,
		count: Number(item.count),
	}));
	const largestSchool =
		schoolData.length > 0
			? schoolData.reduce(
					(
						max: { name: string; code: string; count: number },
						item: { name: string; code: string; count: number }
					) => (item.count > max.count ? item : max)
				)
			: null;

	const countryData = chartData.graduatesByCountry.map((item) => ({
		country: item.country,
		count: Number(item.count),
	}));
	const topCountry =
		countryData.length > 0
			? countryData.reduce(
					(
						max: { country: string; count: number },
						item: { country: string; count: number }
					) => (item.count > max.count ? item : max)
				)
			: null;

	const levelLabels: Record<string, string> = {
		certificate: 'Certificate',
		diploma: 'Diploma',
		degree: 'Degree',
		masters: 'Masters',
		phd: 'PhD',
		Unknown: 'Unknown',
	};
	const programLevelData = chartData.graduatesByProgramLevel.map((item) => ({
		level: item.level,
		label: levelLabels[item.level] || item.level,
		count: Number(item.count),
	}));
	const topProgramLevel =
		programLevelData.length > 0
			? programLevelData.reduce(
					(
						max: { level: string; label: string; count: number },
						item: { level: string; label: string; count: number }
					) => (item.count > max.count ? item : max)
				)
			: null;

	const yearData = chartData.graduatesByYear.map((item) => ({
		year: item.year,
		count: Number(item.count),
	}));

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
							{totalGraduates} graduates across {programsData.length}{' '}
							{programsData.length === 1 ? 'program' : 'programs'}
							{largestProgram &&
								` • Largest: ${largestProgram.code} (${largestProgram.count})`}
						</Text>
					</div>
					<BarChart
						h={300}
						data={programsData}
						dataKey='code'
						series={[{ name: 'count', label: 'Graduates', color: 'teal.6' }]}
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

			{chartData.graduatesBySchool.length > 1 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Graduates by School</Title>
							<Text size='sm' c='dimmed'>
								{chartData.graduatesBySchool.length}{' '}
								{chartData.graduatesBySchool.length === 1
									? 'school'
									: 'schools'}
								{largestSchool &&
									` • Largest: ${largestSchool.code} (${largestSchool.count} graduates)`}
							</Text>
						</div>
						<BarChart
							h={300}
							data={chartData.graduatesBySchool}
							dataKey='code'
							series={[{ name: 'count', label: 'Graduates', color: 'blue.6' }]}
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
						<Title order={4}>Gender</Title>
						<Text size='sm' c='dimmed'>
							{maleCount} Male, {femaleCount} Female
							{genderRatio && ` • Ratio: ${genderRatio}`}
						</Text>
					</div>
					<Center>
						<PieChart
							size={220}
							data={chartData.graduatesByGender.map((item) => ({
								name: item.gender,
								value: Number(item.count),
								color: getGenderColor(item.gender.toLowerCase() as GenderType),
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
							<DonutChart
								size={220}
								thickness={40}
								data={programLevelData.map((item) => ({
									name: item.label,
									value: item.count,
									color: getProgramLevelColor(
										item.level.toLowerCase() as ProgramLevelType
									),
								}))}
								withTooltip
								tooltipDataSource='segment'
							/>
						</Center>
					</Stack>
				</Card>
			)}

			{ageData.length > 0 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Age Distribution</Title>
							<Text size='sm' c='dimmed'>
								Range: {minAge} - {maxAge} years • Most common: {mostCommonAge}{' '}
								years
							</Text>
						</div>
						<BarChart
							h={300}
							data={ageData}
							dataKey='age'
							series={[
								{ name: 'count', label: 'Graduates', color: 'orange.6' },
							]}
							tickLine='y'
							barProps={{ radius: 4 }}
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

			{yearData.length > 1 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Graduations Over Time</Title>
							<Text size='sm' c='dimmed'>
								{yearData.length} years of graduation data
							</Text>
						</div>
						<LineChart
							h={300}
							data={yearData}
							dataKey='year'
							series={[{ name: 'count', label: 'Graduates', color: 'green.6' }]}
							curveType='monotone'
							connectNulls
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

			{countryData.length > 1 && (
				<Card withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={4}>Countries</Title>
							<Text size='sm' c='dimmed'>
								{countryData.length} countries represented
								{topCountry &&
									` • Top: ${topCountry.country} (${topCountry.count})`}
							</Text>
						</div>
						<BarChart
							h={300}
							data={countryData.slice(0, 10)}
							dataKey='country'
							series={[
								{ name: 'count', label: 'Graduates', color: 'violet.6' },
							]}
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
