'use client';

import {
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconCalendarTime, IconClock } from '@tabler/icons-react';
import { getPercentageColor } from '@/shared/lib/utils/colors';
import type { QuizAttemptDetails } from '../../types';

type Props = {
	attempt: QuizAttemptDetails;
	maxGrade: number;
};

function formatDuration(startTime: number, endTime: number | null): string {
	if (!endTime) return 'In progress';
	const seconds = endTime - startTime;
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (hours > 0) {
		return `${hours}h ${remainingMinutes}m`;
	}
	return `${minutes}m`;
}

function formatDate(timestamp: number | null): string {
	if (!timestamp) return 'N/A';
	return new Date(timestamp * 1000).toLocaleString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function QuizAttemptSummary({ attempt, maxGrade }: Props) {
	const correctCount = attempt.questions.filter(
		(q) => q.state === 'gradedright'
	).length;
	const incorrectCount = attempt.questions.filter(
		(q) => q.state === 'gradedwrong'
	).length;
	const partialCount = attempt.questions.filter(
		(q) => q.state === 'gradedpartial'
	).length;
	const needsGradingCount = attempt.questions.filter(
		(q) => q.state === 'needsgrading'
	).length;

	const gradePercentage =
		attempt.sumgrades !== null ? (attempt.sumgrades / maxGrade) * 100 : null;

	return (
		<Paper p='md' withBorder>
			<Stack gap='lg'>
				<Group justify='space-between' wrap='nowrap'>
					<Box>
						<Text size='xs' c='dimmed' mb={4}>
							Grade
						</Text>
						<Group gap='xs' align='baseline'>
							<Text size='xl' fw={700} c={getPercentageColor(gradePercentage)}>
								{attempt.sumgrades !== null
									? attempt.sumgrades.toFixed(1)
									: '-'}
							</Text>
							<Text size='sm' c='dimmed'>
								/ {maxGrade}
							</Text>
							{gradePercentage !== null && (
								<Badge
									size='sm'
									variant='light'
									color={getPercentageColor(gradePercentage)}
								>
									{gradePercentage.toFixed(0)}%
								</Badge>
							)}
						</Group>
					</Box>

					{needsGradingCount > 0 && (
						<Badge size='md' color='orange' variant='light'>
							{needsGradingCount} question{needsGradingCount !== 1 ? 's' : ''}{' '}
							need grading
						</Badge>
					)}
				</Group>

				<Divider />

				<Group gap={50}>
					<Group gap='xs'>
						<ThemeIcon size='sm' variant='light' color='gray'>
							<IconCalendarTime size={14} />
						</ThemeIcon>
						<Box>
							<Text size='xs' c='dimmed'>
								Submitted
							</Text>
							<Text size='sm'>{formatDate(attempt.timefinish)}</Text>
						</Box>
					</Group>

					<Group gap='xs'>
						<ThemeIcon size='sm' variant='light' color='gray'>
							<IconClock size={14} />
						</ThemeIcon>
						<Box>
							<Text size='xs' c='dimmed'>
								Duration
							</Text>
							<Text size='sm'>
								{formatDuration(attempt.timestart, attempt.timefinish)}
							</Text>
						</Box>
					</Group>
				</Group>

				<Divider />

				<Group gap={80}>
					<Box>
						<Text size='xs' c='dimmed'>
							Correct
						</Text>
						<Text size='sm' c='green' fw={500}>
							{correctCount}
						</Text>
					</Box>
					{partialCount > 0 && (
						<Box>
							<Text size='xs' c='dimmed'>
								Partial
							</Text>
							<Text size='sm' c='yellow' fw={500}>
								{partialCount}
							</Text>
						</Box>
					)}
					<Box>
						<Text size='xs' c='dimmed'>
							Incorrect
						</Text>
						<Text size='sm' c='red' fw={500}>
							{incorrectCount}
						</Text>
					</Box>
					<Box>
						<Text size='xs' c='dimmed'>
							Pending
						</Text>
						<Text size='sm' c='orange' fw={500}>
							{needsGradingCount}
						</Text>
					</Box>
				</Group>
			</Stack>
		</Paper>
	);
}
