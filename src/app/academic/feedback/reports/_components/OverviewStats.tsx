'use client';

import { Card, Grid, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import {
	IconMessageDots,
	IconPercentage,
	IconStar,
	IconUsers,
} from '@tabler/icons-react';
import type { OverviewStats as OverviewStatsType } from '../_lib/types';

type Props = {
	data: OverviewStatsType;
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
								Total Responses
							</Text>
							<ThemeIcon variant='light' color='blue' size='sm'>
								<IconMessageDots size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700}>
							{data.totalResponses.toLocaleString()}
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Average Rating
							</Text>
							<ThemeIcon
								variant='light'
								color={ratingColor(data.avgRating)}
								size='sm'
							>
								<IconStar size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700} c={ratingColor(data.avgRating)}>
							{data.avgRating.toFixed(2)} / 5
						</Text>
					</Stack>
				</Card>
			</Grid.Col>

			<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
				<Card withBorder h='100%'>
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed' fw={500}>
								Response Rate
							</Text>
							<ThemeIcon variant='light' color='cyan' size='sm'>
								<IconPercentage size={14} />
							</ThemeIcon>
						</Group>
						<Text size='xl' fw={700}>
							{data.responseRate}%
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
