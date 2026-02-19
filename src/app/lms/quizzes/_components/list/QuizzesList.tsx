'use client';

import {
	Box,
	Card,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getCourseQuizzes } from '../../_server/actions';
import QuizCard from './QuizCard';

type QuizzesListProps = {
	courseId: number;
	moduleId?: number;
};

function QuizCardSkeleton() {
	return (
		<Card padding='md' withBorder>
			<Stack gap='sm'>
				<Card.Section withBorder inheritPadding py='xs'>
					<Group justify='space-between' wrap='nowrap'>
						<Skeleton height={20} width='60%' />
						<Skeleton height={22} width={80} radius='sm' />
					</Group>
				</Card.Section>

				<Group gap='lg' py='xs'>
					<Skeleton height={16} width={100} />
					<Skeleton height={16} width={80} />
				</Group>

				<Card.Section withBorder inheritPadding py='xs'>
					<Group gap='xl'>
						<Group gap='xs'>
							<IconClock size={16} style={{ opacity: 0.3 }} />
							<Skeleton height={14} width={180} />
						</Group>
					</Group>
				</Card.Section>
			</Stack>
		</Card>
	);
}

export default function QuizzesList({ courseId, moduleId }: QuizzesListProps) {
	const { data: quizzes, isLoading } = useQuery({
		queryKey: ['course-quizzes', courseId],
		queryFn: () => getCourseQuizzes(courseId),
	});

	if (isLoading) {
		return (
			<SimpleGrid cols={{ base: 1, sm: 3 }}>
				{[1, 2, 3].map((i) => (
					<QuizCardSkeleton key={i} />
				))}
			</SimpleGrid>
		);
	}

	if (!quizzes || quizzes.length === 0) {
		return (
			<Box ta='center' py='xl'>
				<Text c='dimmed'>No quizzes found for this course</Text>
			</Box>
		);
	}

	return (
		<SimpleGrid cols={{ base: 1, sm: 3 }}>
			{quizzes.map((quiz) => (
				<QuizCard
					key={quiz.id}
					quiz={quiz}
					courseId={courseId}
					moduleId={moduleId}
				/>
			))}
		</SimpleGrid>
	);
}
