'use client';

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
import { getStudentPhoto } from '@registry/students';
import {
	IconListCheck,
	IconMessageCircle,
	IconUsers,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { SubmissionFile, SubmissionUser } from '../../types';
import CommentsView from './CommentsView';
import FileList from './FileList';
import GradeInput from './GradeInput';
import RubricView from './RubricView';
import { formatDate } from './utils';

type StudentAvatarProps = {
	stdNo: number;
	size?: string;
};

function StudentAvatar({ stdNo, size = 'md' }: StudentAvatarProps) {
	const { data: photoUrl } = useQuery({
		queryKey: ['student-photo', stdNo],
		queryFn: () => getStudentPhoto(stdNo),
		staleTime: 1000 * 60 * 5,
	});

	return <Avatar src={photoUrl} size={size} radius='xl' />;
}

type Props = {
	selectedUser: SubmissionUser | null;
	files: SubmissionFile[];
	assignmentId: number;
	maxGrade: number;
	existingGrade?: number;
	cmid?: number;
};

export default function SubmissionDetails({
	selectedUser,
	files,
	assignmentId,
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
						<StudentAvatar stdNo={selectedUser.dbStudent.stdNo} />
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
			<FileList files={files} />

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
					</TabsList>

					<TabsPanel value='rubric' pt='md'>
						{cmid ? (
							<RubricView
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
				</Tabs>
			)}
		</Stack>
	);
}
