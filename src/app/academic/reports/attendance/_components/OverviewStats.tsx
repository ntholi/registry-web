'use client';

import {
	Badge,
	Card,
	Grid,
	Group,
	Progress,
	RingProgress,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconAlertTriangle,
	IconCheck,
	IconClock,
	IconUserExclamation,
	IconUsers,
	IconX,
} from '@tabler/icons-react';
import type { OverviewStats as OverviewStatsType } from '../_server/repository';

type Props = {
	data: OverviewStatsType;
};

export default function OverviewStats({ data }: Props) {
	const attendanceColor =
		data.avgAttendanceRate >= 75
			? 'green'
			: data.avgAttendanceRate >= 50
				? 'yellow'
				: 'red';

	const atRiskColor =
		data.atRiskPercentage <= 10
			? 'green'
			: data.atRiskPercentage <= 25
				? 'yellow'
				: 'red';

	return (
		<Grid gutter='md'>
			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Total Students
							</Text>
							<ThemeIcon variant='light' color='blue' size='sm'>
								<IconUsers size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700}>
							{data.totalStudents.toLocaleString()}
						</Text>
						<Text size='xs' c='dimmed'>
							Enrolled in selected filters
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Avg. Attendance Rate
							</Text>
							<RingProgress
								size={40}
								thickness={4}
								sections={[
									{ value: data.avgAttendanceRate, color: attendanceColor },
								]}
								label={
									<Text size='xs' ta='center' fw={700}>
										{data.avgAttendanceRate}%
									</Text>
								}
							/>
						</Group>
						<Progress
							value={data.avgAttendanceRate}
							color={attendanceColor}
							size='lg'
							radius='xl'
						/>
						<Text size='xs' c='dimmed'>
							Based on marked attendance
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								At-Risk Students
							</Text>
							<ThemeIcon variant='light' color={atRiskColor} size='sm'>
								<IconUserExclamation size={14} />
							</ThemeIcon>
						</Group>
						<Group gap='xs' align='baseline'>
							<Text size='xl' fw={700} c={atRiskColor}>
								{data.totalAtRisk.toLocaleString()}
							</Text>
							<Badge size='sm' color={atRiskColor} variant='light'>
								{data.atRiskPercentage}%
							</Badge>
						</Group>
						<Text size='xs' c='dimmed'>
							Below 75% attendance rate
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Text size='sm' c='dimmed' fw={500}>
							Attendance Breakdown
						</Text>
						<Group gap='md'>
							<Group gap={4}>
								<ThemeIcon size='xs' color='green' variant='filled'>
									<IconCheck size={10} />
								</ThemeIcon>
								<Text size='sm' fw={500}>
									{data.totalPresent.toLocaleString()}
								</Text>
							</Group>
							<Group gap={4}>
								<ThemeIcon size='xs' color='red' variant='filled'>
									<IconX size={10} />
								</ThemeIcon>
								<Text size='sm' fw={500}>
									{data.totalAbsent.toLocaleString()}
								</Text>
							</Group>
							<Group gap={4}>
								<ThemeIcon size='xs' color='yellow' variant='filled'>
									<IconClock size={10} />
								</ThemeIcon>
								<Text size='sm' fw={500}>
									{data.totalLate.toLocaleString()}
								</Text>
							</Group>
							<Group gap={4}>
								<ThemeIcon size='xs' color='blue' variant='filled'>
									<IconAlertTriangle size={10} />
								</ThemeIcon>
								<Text size='sm' fw={500}>
									{data.totalExcused.toLocaleString()}
								</Text>
							</Group>
						</Group>
						<Group gap='xs'>
							<Badge size='xs' color='green' variant='light'>
								Present
							</Badge>
							<Badge size='xs' color='red' variant='light'>
								Absent
							</Badge>
							<Badge size='xs' color='yellow' variant='light'>
								Late
							</Badge>
							<Badge size='xs' color='blue' variant='light'>
								Excused
							</Badge>
						</Group>
					</Stack>
				</Card>
			</Grid.Col>
		</Grid>
	);
}
