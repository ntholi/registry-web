'use client';

import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { IconClock, IconQuestionMark } from '@tabler/icons-react';
import type { MoodleQuiz } from '../../types';

type Props = {
	quiz: MoodleQuiz;
	courseId: number;
};

function formatDuration(seconds: number): string {
	if (seconds === 0) return 'No limit';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getQuizStatus(quiz: MoodleQuiz): {
	label: string;
	color: string;
} {
	const now = Date.now() / 1000;

	if (quiz.timeopen > 0 && now < quiz.timeopen) {
		return { label: 'Not yet open', color: 'gray' };
	}

	if (quiz.timeclose > 0 && now > quiz.timeclose) {
		return { label: 'Closed', color: 'red' };
	}

	return { label: 'Open', color: 'green' };
}

export default function QuizCard({ quiz }: Props) {
	const status = getQuizStatus(quiz);
	const closeDate = quiz.timeclose ? new Date(quiz.timeclose * 1000) : null;
	const isOverdue = closeDate && closeDate < new Date();

	return (
		<Card padding='md' withBorder>
			<Stack gap='sm'>
				<Card.Section withBorder inheritPadding py='xs'>
					<Group justify='space-between' wrap='nowrap'>
						<Text fw={500} size='md'>
							{quiz.name}
						</Text>
						<Badge size='sm' variant='light' color={status.color}>
							{status.label}
						</Badge>
					</Group>
				</Card.Section>

				<Group gap='lg' py='xs'>
					<Group gap='xs'>
						<IconQuestionMark size={16} />
						<Text size='sm' c='dimmed'>
							{quiz.questions?.length || 0} questions
						</Text>
					</Group>
					{quiz.timelimit > 0 && (
						<Group gap='xs'>
							<IconClock size={16} />
							<Text size='sm' c='dimmed'>
								{formatDuration(quiz.timelimit)}
							</Text>
						</Group>
					)}
					<Badge variant='outline' size='sm'>
						{quiz.grade} marks
					</Badge>
				</Group>

				<Card.Section withBorder inheritPadding py='xs'>
					<Group gap='xl'>
						{closeDate && (
							<Group gap='xs'>
								<IconClock size={16} />
								<Text size='xs' c={isOverdue ? 'red' : 'dimmed'}>
									Closes: {closeDate.toLocaleDateString()} at{' '}
									{closeDate.toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit',
									})}
								</Text>
							</Group>
						)}
						{quiz.attempts > 0 && (
							<Text size='xs' c='dimmed'>
								{quiz.attempts} {quiz.attempts === 1 ? 'attempt' : 'attempts'}{' '}
								allowed
							</Text>
						)}
						{quiz.attempts === 0 && (
							<Text size='xs' c='dimmed'>
								Unlimited attempts
							</Text>
						)}
					</Group>
				</Card.Section>
			</Stack>
		</Card>
	);
}
