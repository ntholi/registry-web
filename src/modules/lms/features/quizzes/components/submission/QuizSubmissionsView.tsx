'use client';

import { Grid, Loader, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getQuizSubmissions } from '../../server/actions';
import type { QuizSubmissionUser } from '../../types';
import QuizStudentList from './QuizStudentList';
import QuizSubmissionDetails from './QuizSubmissionDetails';

type Props = {
	quizId: number;
	courseId: number;
	maxGrade: number;
};

export default function QuizSubmissionsView({
	quizId,
	courseId,
	maxGrade,
}: Props) {
	const [selectedUser, setSelectedUser] = useState<QuizSubmissionUser | null>(
		null
	);

	const { data: users, isLoading } = useQuery({
		queryKey: ['quiz-submissions', quizId, courseId],
		queryFn: () => getQuizSubmissions(quizId, courseId),
	});

	if (isLoading) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' py='xl'>
					<Loader size='md' />
					<Text c='dimmed' size='sm'>
						Loading submissions...
					</Text>
				</Stack>
			</Paper>
		);
	}

	if (!users || users.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' py='xl'>
					<ThemeIcon size={60} variant='light' color='gray'>
						<IconUsers size={30} />
					</ThemeIcon>
					<Text c='dimmed' size='sm'>
						No students enrolled in this course.
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Grid gutter='md'>
			<Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
				<Paper p='md' withBorder h='100%'>
					<QuizStudentList
						users={users}
						selectedUser={selectedUser}
						onSelectUser={setSelectedUser}
						maxGrade={maxGrade}
					/>
				</Paper>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
				<Paper p='md' withBorder h='100%'>
					<QuizSubmissionDetails
						selectedUser={selectedUser}
						quizId={quizId}
						maxGrade={maxGrade}
					/>
				</Paper>
			</Grid.Col>
		</Grid>
	);
}
