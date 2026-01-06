'use client';

import StudentAvatar from '@lms/_shared/StudentAvatar';
import {
	Avatar,
	Box,
	Group,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconFileSearch,
	IconListCheck,
	IconMessageCircle,
	IconUsers,
} from '@tabler/icons-react';
import { useState } from 'react';
import type { SubmissionFile, SubmissionUser } from '../../../types';
import { GradeInput, RubricGrading } from '../../grading/components';
import { formatDate } from '../utils';
import CommentsView from './CommentsView';
import FileList from './FileList';
import TurnitinView from './TurnitinView';

type Props = {
	selectedUser: SubmissionUser | null;
	files: SubmissionFile[];
	assignmentId: number;
	courseId: number;
	maxGrade: number;
	existingGrade?: number;
	cmid?: number;
};

export default function SubmissionDetails({
	selectedUser,
	files,
	assignmentId,
	courseId,
	maxGrade,
	existingGrade,
	cmid,
}: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('rubric');
	const [rubricGrade, setRubricGrade] = useState<number | undefined>(
		existingGrade
	);

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

	const displayName = selectedUser.dbStudent?.name ?? selectedUser.fullname;

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Group gap='sm'>
					{selectedUser.dbStudent ? (
						<StudentAvatar
							stdNo={selectedUser.dbStudent.stdNo}
							size='md'
							radius='xl'
						/>
					) : (
						<Avatar src={selectedUser.profileimageurl} size='md' radius='xl' />
					)}
					<Box>
						<Text fw={600}>{displayName}</Text>
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
						existingGrade={rubricGrade}
					/>
				)}
			</Group>
			<FileList
				files={files}
				viewerUrl={
					selectedUser
						? `/lms/courses/${courseId}/assignments/${assignmentId}/submission/${selectedUser.id}`
						: undefined
				}
			/>

			{selectedUser.submission?.status === 'submitted' && (
				<Tabs
					value={activeTab}
					onChange={setActiveTab}
					variant='outline'
					mt={'md'}
				>
					<TabsList>
						<TabsTab value='rubric' leftSection={<IconListCheck size={16} />}>
							Rubric
						</TabsTab>
						<TabsTab
							value='comments'
							leftSection={<IconMessageCircle size={16} />}
						>
							Comments
						</TabsTab>
						<TabsTab
							value='turnitin'
							leftSection={<IconFileSearch size={16} />}
						>
							Turnitin
						</TabsTab>
					</TabsList>

					<TabsPanel value='rubric' pt='md'>
						{cmid ? (
							<RubricGrading
								cmid={cmid}
								assignmentId={assignmentId}
								userId={selectedUser.id}
								onGradeChange={setRubricGrade}
							/>
						) : (
							<Text c='dimmed' size='sm'>
								No course module ID available
							</Text>
						)}
					</TabsPanel>

					<TabsPanel value='comments' pt='md'>
						<CommentsView
							assignmentId={assignmentId}
							userId={selectedUser.id}
						/>
					</TabsPanel>

					<TabsPanel value='turnitin' pt='md'>
						<TurnitinView />
					</TabsPanel>
				</Tabs>
			)}
		</Stack>
	);
}
