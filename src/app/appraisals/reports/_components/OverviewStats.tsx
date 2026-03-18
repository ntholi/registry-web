'use client';

import { Card, Grid, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import {
	IconChartBar,
	IconEye,
	IconMessageDots,
	IconUsers,
} from '@tabler/icons-react';
import type { OverviewData } from '../_lib/types';

type Props = {
	data: OverviewData;
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
								Combined Average
							</Text>
							<ThemeIcon
								variant='light'
								color={ratingColor(data.combinedAvg)}
								size='sm'
							>
								<IconChartBar size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700} c={ratingColor(data.combinedAvg)}>
							{data.combinedAvg.toFixed(1)} / 5
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Feedback Average
							</Text>
							<ThemeIcon
								variant='light'
								color={ratingColor(data.feedbackAvg)}
								size='sm'
							>
								<IconMessageDots size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700} c={ratingColor(data.feedbackAvg)}>
							{data.feedbackAvg.toFixed(1)} / 5
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Observation Average
							</Text>
							<ThemeIcon
								variant='light'
								color={ratingColor(data.observationAvg)}
								size='sm'
							>
								<IconEye size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700} c={ratingColor(data.observationAvg)}>
							{data.observationAvg.toFixed(1)} / 5
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
		</Grid>
	);
}
