'use client';

import { Box, Grid, Paper, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type {
	MoodleAssignment,
	SubmissionFile,
	SubmissionUser,
} from '../../../types';
import { getSubmissionFiles } from '../utils';
import FilePreview from './FilePreview';
import FilesSidebar from './FilesSidebar';
import GradingPanel from './GradingPanel';
import ViewerHeader from './ViewerHeader';

type Props = {
	assignment: MoodleAssignment;
	course: { id: number; name: string };
	users: SubmissionUser[];
	currentUser: SubmissionUser;
	initialFileIndex: number;
};

export default function SubmissionViewer({
	assignment,
	course,
	users,
	currentUser,
	initialFileIndex,
}: Props) {
	const router = useRouter();
	const [selectedFileIndex, setSelectedFileIndex] = useState(initialFileIndex);

	const files: SubmissionFile[] = getSubmissionFiles(currentUser);
	const currentFile = files[selectedFileIndex] || null;

	const submittedUsers = users.filter(
		(u) => u.submission && u.submission.status === 'submitted'
	);
	const currentSubmittedIndex = submittedUsers.findIndex(
		(u) => u.id === currentUser.id
	);

	function handlePrevUser() {
		if (currentSubmittedIndex > 0) {
			const prevUser = submittedUsers[currentSubmittedIndex - 1];
			router.push(
				`/lms/courses/${course.id}/assessments/${assignment.id}/submission/${prevUser.id}`
			);
		}
	}

	function handleNextUser() {
		if (currentSubmittedIndex < submittedUsers.length - 1) {
			const nextUser = submittedUsers[currentSubmittedIndex + 1];
			router.push(
				`/lms/courses/${course.id}/assessments/${assignment.id}/submission/${nextUser.id}`
			);
		}
	}

	function transformMoodleFileUrl(url: string): string {
		return url.replace('/webservice/pluginfile.php', '/pluginfile.php');
	}

	return (
		<Box
			style={{
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
			}}
		>
			<ViewerHeader
				assignment={assignment}
				course={course}
				currentUser={currentUser}
				users={users}
				onPrevUser={handlePrevUser}
				onNextUser={handleNextUser}
				currentFileUrl={
					currentFile ? transformMoodleFileUrl(currentFile.fileurl) : undefined
				}
			/>

			<Box style={{ flex: 1, overflow: 'hidden' }}>
				<Grid gutter={0} h='100%'>
					<Grid.Col
						span={{ base: 12, md: 2 }}
						style={{
							borderRight: '1px solid var(--mantine-color-default-border)',
						}}
					>
						<Paper p='md' h='100%' radius={0}>
							<Stack gap='lg'>
								<FilesSidebar
									files={files}
									selectedIndex={selectedFileIndex}
									onSelectFile={setSelectedFileIndex}
								/>
							</Stack>
						</Paper>
					</Grid.Col>

					<Grid.Col span={{ base: 12, md: 7 }}>
						<Box
							h='100%'
							style={{
								background: 'var(--mantine-color-dark-8)',
								overflow: 'hidden',
							}}
						>
							<FilePreview file={currentFile} />
						</Box>
					</Grid.Col>

					<Grid.Col
						span={{ base: 12, md: 3 }}
						style={{
							borderLeft: '1px solid var(--mantine-color-default-border)',
						}}
					>
						<Paper p='md' h='100%' radius={0}>
							<GradingPanel
								assignmentId={assignment.id}
								userId={currentUser.id}
								maxGrade={assignment.grade > 0 ? assignment.grade : 100}
								cmid={assignment.cmid}
							/>
						</Paper>
					</Grid.Col>
				</Grid>
			</Box>
		</Box>
	);
}
