'use client';

import {
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	Progress,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCalendarTime,
	IconCheck,
	IconClock,
	IconMinus,
	IconTarget,
	IconX,
} from '@tabler/icons-react';
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
	const totalQuestions = attempt.questions.length;

	const gradePercentage =
		attempt.sumgrades !== null ? (attempt.sumgrades / maxGrade) * 100 : null;

	function getGradeColor(percentage: number | null): string {
		if (percentage === null) return 'gray';
		if (percentage >= 75) return 'green';
		if (percentage >= 50) return 'yellow';
		return 'red';
	}

	return (
		<Paper p='md' withBorder>
			<Stack gap='md'>
				<Group justify='space-between' wrap='nowrap'>
					<Box>
						<Text size='xs' c='dimmed' mb={4}>
							Grade
						</Text>
						<Group gap='xs' align='baseline'>
							<Text size='xl' fw={700} c={getGradeColor(gradePercentage)}>
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
									color={getGradeColor(gradePercentage)}
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

				<Group gap='xl'>
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

					<Group gap='xs'>
						<ThemeIcon size='sm' variant='light' color='gray'>
							<IconTarget size={14} />
						</ThemeIcon>
						<Box>
							<Text size='xs' c='dimmed'>
								Questions
							</Text>
							<Text size='sm'>{totalQuestions}</Text>
						</Box>
					</Group>
				</Group>

				<Divider />

				<Box>
					<Text size='xs' c='dimmed' mb='xs'>
						Question Results
					</Text>
					<Progress.Root size='lg'>
						<Progress.Section
							value={(correctCount / totalQuestions) * 100}
							color='green'
						>
							<Progress.Label>{correctCount}</Progress.Label>
						</Progress.Section>
						<Progress.Section
							value={(partialCount / totalQuestions) * 100}
							color='yellow'
						>
							<Progress.Label>{partialCount}</Progress.Label>
						</Progress.Section>
						<Progress.Section
							value={(incorrectCount / totalQuestions) * 100}
							color='red'
						>
							<Progress.Label>{incorrectCount}</Progress.Label>
						</Progress.Section>
						<Progress.Section
							value={(needsGradingCount / totalQuestions) * 100}
							color='orange'
						>
							<Progress.Label>{needsGradingCount}</Progress.Label>
						</Progress.Section>
					</Progress.Root>
					<Group gap='md' mt='xs'>
						<Group gap={4}>
							<ThemeIcon size='xs' color='green' variant='filled'>
								<IconCheck size={10} />
							</ThemeIcon>
							<Text size='xs'>Correct: {correctCount}</Text>
						</Group>
						<Group gap={4}>
							<ThemeIcon size='xs' color='yellow' variant='filled'>
								<IconMinus size={10} />
							</ThemeIcon>
							<Text size='xs'>Partial: {partialCount}</Text>
						</Group>
						<Group gap={4}>
							<ThemeIcon size='xs' color='red' variant='filled'>
								<IconX size={10} />
							</ThemeIcon>
							<Text size='xs'>Incorrect: {incorrectCount}</Text>
						</Group>
						{needsGradingCount > 0 && (
							<Group gap={4}>
								<ThemeIcon size='xs' color='orange' variant='filled'>
									<IconTarget size={10} />
								</ThemeIcon>
								<Text size='xs'>Needs Grading: {needsGradingCount}</Text>
							</Group>
						)}
					</Group>
				</Box>
			</Stack>
		</Paper>
	);
}
