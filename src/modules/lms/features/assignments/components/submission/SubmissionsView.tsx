'use client';

import { Grid, Loader, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { SubmissionUser } from '../../types';
import StudentList from './StudentList';
import SubmissionDetails from './SubmissionDetails';
import { getAssignmentSubmissions } from './server/actions';
import { getSubmissionFiles } from './utils';
import { getAssignmentGrades } from './viewer/server/actions';

type Props = {
	assignmentId: number;
	courseId: number;
	maxGrade: number;
	cmid?: number;
};

export default function SubmissionsView({
	assignmentId,
	courseId,
	maxGrade,
	cmid = undefined,
}: Props) {
	const [selectedUser, setSelectedUser] = useState<SubmissionUser | null>(null);

	const { data: users, isLoading } = useQuery({
		queryKey: ['assignment-submissions', assignmentId, courseId],
		queryFn: () => getAssignmentSubmissions(assignmentId, courseId),
	});

	const { data: grades } = useQuery({
		queryKey: ['assignment-grades', assignmentId],
		queryFn: () => getAssignmentGrades(assignmentId),
		staleTime: 0,
		refetchOnMount: 'always',
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

	const files = selectedUser ? getSubmissionFiles(selectedUser) : [];
	const existingGrade = selectedUser ? grades?.get(selectedUser.id) : undefined;

	return (
		<Grid gutter='md'>
			<Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
				<Paper p='md' withBorder h='100%'>
					<StudentList
						users={users}
						selectedUser={selectedUser}
						onSelectUser={setSelectedUser}
					/>
				</Paper>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
				<Paper p='md' withBorder h='100%'>
					<SubmissionDetails
						selectedUser={selectedUser}
						files={files}
						assignmentId={assignmentId}
						courseId={courseId}
						maxGrade={maxGrade}
						existingGrade={existingGrade}
						cmid={cmid}
					/>
				</Paper>
			</Grid.Col>
		</Grid>
	);
}
