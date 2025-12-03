'use client';

import { Avatar, Box, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import type { SubmissionFile, SubmissionUser } from '../../types';
import FileList from './FileList';
import GradeInput from './GradeInput';
import { formatDate } from './utils';

type Props = {
	selectedUser: SubmissionUser | null;
	files: SubmissionFile[];
	assignmentId: number;
	maxGrade: number;
	existingGrade?: number;
};

export default function SubmissionDetails({
	selectedUser,
	files,
	assignmentId,
	maxGrade,
	existingGrade,
}: Props) {
	if (!selectedUser) {
		return (
			<Stack align='center' py='xl'>
				<ThemeIcon size={60} variant='light' color='gray'>
					<IconUsers size={30} />
				</ThemeIcon>
				<Text c='dimmed' size='sm'>
					Select a student to view their submission
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Group gap='sm'>
					<Avatar src={selectedUser.profileimageurl} size='md' radius='xl' />
					<Box>
						<Text fw={600}>{selectedUser.fullname}</Text>
						{selectedUser.submission && (
							<Text size='xs' c='dimmed'>
								Submitted {formatDate(selectedUser.submission.timemodified)}
							</Text>
						)}
					</Box>
				</Group>
				{selectedUser.submission?.status === 'submitted' && (
					<GradeInput
						assignmentId={assignmentId}
						userId={selectedUser.id}
						maxGrade={maxGrade}
						existingGrade={existingGrade}
					/>
				)}
			</Group>
			<FileList files={files} />
		</Stack>
	);
}
