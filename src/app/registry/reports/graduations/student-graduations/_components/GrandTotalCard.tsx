'use client';
import {
	Badge,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCalendarTime,
	IconClock,
	IconGenderBigender,
	IconSchool,
	IconUsers,
} from '@tabler/icons-react';
import type { ReportFocusArea } from './ReportFocusModal';

interface GrandTotalCardProps {
	totalGraduates: number;
	maleCount: number;
	femaleCount: number;
	averageAge?: number | null;
	averageTimeToGraduate?: number | null;
	schoolCount: number;
	programCount: number;
	focusAreas: ReportFocusArea[];
}

export default function GrandTotalCard({
	totalGraduates,
	maleCount,
	femaleCount,
	averageAge,
	averageTimeToGraduate,
	schoolCount,
	programCount,
	focusAreas,
}: GrandTotalCardProps) {
	const showAll = focusAreas.length === 0;
	const showGender = showAll || focusAreas.includes('gender');
	const showAge = showAll || focusAreas.includes('age');
	const showTimeToGraduate = showAll || focusAreas.includes('timeToGraduate');

	return (
		<Paper withBorder p='lg' bg='var(--mantine-color-dark-7)'>
			<Stack gap='md'>
				<Group justify='space-between' align='center'>
					<Group gap='xs'>
						<ThemeIcon size='lg' variant='light' color='blue'>
							<IconSchool size={20} />
						</ThemeIcon>
						<Stack gap={0}>
							<Text fw={700} size='lg'>
								Grand Total Summary
							</Text>
							<Text size='sm' c='dimmed'>
								Across {schoolCount} school{schoolCount !== 1 ? 's' : ''} and{' '}
								{programCount} program{programCount !== 1 ? 's' : ''}
							</Text>
						</Stack>
					</Group>
					<Badge size='xl' variant='filled' radius='sm'>
						{totalGraduates} Graduate{totalGraduates !== 1 ? 's' : ''}
					</Badge>
				</Group>

				<SimpleGrid cols={{ base: 2, sm: 3, md: showAll ? 5 : 3 }} spacing='md'>
					{showGender && (
						<>
							<StatCard
								icon={<IconGenderBigender size={18} />}
								label='Male'
								value={maleCount}
								color='blue'
							/>
							<StatCard
								icon={<IconGenderBigender size={18} />}
								label='Female'
								value={femaleCount}
								color='pink'
							/>
						</>
					)}

					{showAge && (
						<StatCard
							icon={<IconCalendarTime size={18} />}
							label='Avg. Age'
							value={
								averageAge != null ? `${averageAge.toFixed(1)} yrs` : 'N/A'
							}
							color='teal'
						/>
					)}

					{showTimeToGraduate && (
						<StatCard
							icon={<IconClock size={18} />}
							label='Avg. Time to Graduate'
							value={
								averageTimeToGraduate != null
									? `${averageTimeToGraduate.toFixed(1)} yrs`
									: 'N/A'
							}
							color='orange'
						/>
					)}

					<StatCard
						icon={<IconUsers size={18} />}
						label='Gender Ratio'
						value={
							totalGraduates > 0
								? `${((maleCount / totalGraduates) * 100).toFixed(0)}% / ${((femaleCount / totalGraduates) * 100).toFixed(0)}%`
								: 'N/A'
						}
						color='grape'
						subtitle='M / F'
					/>
				</SimpleGrid>
			</Stack>
		</Paper>
	);
}

interface StatCardProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
	color: string;
	subtitle?: string;
}

function StatCard({ icon, label, value, color, subtitle }: StatCardProps) {
	return (
		<Paper withBorder p='sm' radius='md'>
			<Group gap='xs' wrap='nowrap'>
				<ThemeIcon variant='light' color={color} size='sm'>
					{icon}
				</ThemeIcon>
				<Stack gap={0}>
					<Text size='xs' c='dimmed'>
						{label}
					</Text>
					<Text fw={600} size='sm'>
						{value}
					</Text>
					{subtitle && (
						<Text size='xs' c='dimmed'>
							{subtitle}
						</Text>
					)}
				</Stack>
			</Group>
		</Paper>
	);
}
