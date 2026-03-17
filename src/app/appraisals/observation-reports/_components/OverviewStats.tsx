'use client';

import { Card, Grid, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconEye, IconStar, IconUsers } from '@tabler/icons-react';
import type { ObservationOverviewStats } from '../_lib/types';

type Props = {
	data: ObservationOverviewStats;
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

export default function OverviewStats({ data }: Props) {
	return (
		<Grid gutter='md'>
			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Total Observations
							</Text>
							<ThemeIcon variant='light' color='blue' size='sm'>
								<IconEye size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700}>
							{data.totalObservations.toLocaleString()}
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Average Score
							</Text>
							<ThemeIcon
								variant='light'
								color={ratingColor(data.avgScore)}
								size='sm'
							>
								<IconStar size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700} c={ratingColor(data.avgScore)}>
							{data.avgScore.toFixed(2)} / 5
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Lecturers Evaluated
							</Text>
							<ThemeIcon variant='light' color='violet' size='sm'>
								<IconUsers size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700}>
							{data.lecturersEvaluated.toLocaleString()}
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Acknowledgment Rate
							</Text>
							<ThemeIcon variant='light' color='cyan' size='sm'>
								<IconCheck size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700}>
							{data.acknowledgmentRate}%
						</Text>
					</Stack>
				</Card>
			</Grid.Col>
		</Grid>
	);
}
