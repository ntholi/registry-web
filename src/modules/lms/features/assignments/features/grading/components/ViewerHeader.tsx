'use client';

import { ActionIcon, Avatar, Box, Group, Text, Tooltip } from '@mantine/core';
import {
	IconArrowLeft,
	IconChevronLeft,
	IconChevronRight,
	IconDownload,
	IconExternalLink,
} from '@tabler/icons-react';
import Link from 'next/link';
import StudentAvatar from '@/modules/lms/shared/StudentAvatar';
import type { MoodleAssignment, SubmissionUser } from '../../../types';
import { formatDate } from '../../submissions/utils';

type Props = {
	assignment: MoodleAssignment;
	course: { id: number; name: string };
	currentUser: SubmissionUser;
	users: SubmissionUser[];
	onPrevUser: () => void;
	onNextUser: () => void;
	currentFileUrl?: string;
};

export default function ViewerHeader({
	assignment,
	course,
	currentUser,
	users,
	onPrevUser,
	onNextUser,
	currentFileUrl,
}: Props) {
	const submittedUsers = users.filter(
		(u) => u.submission && u.submission.status === 'submitted'
	);
	const currentIndex = submittedUsers.findIndex((u) => u.id === currentUser.id);
	const hasPrev = currentIndex > 0;
	const hasNext = currentIndex < submittedUsers.length - 1;

	const displayName = currentUser.dbStudent?.name ?? currentUser.fullname;

	return (
		<Group
			justify='space-between'
			px='md'
			py='sm'
			style={{
				borderBottom: '1px solid var(--mantine-color-default-border)',
				background: 'var(--mantine-color-body)',
			}}
		>
			<Group gap='md'>
				<Tooltip label='Back to assignment'>
					<ActionIcon
						component={Link}
						href={`/lms/courses/${course.id}/assignments/${assignment.id}?tab=submissions`}
						variant='subtle'
						size='lg'
					>
						<IconArrowLeft size={20} />
					</ActionIcon>
				</Tooltip>

				<Box>
					<Text size='sm' fw={600}>
						{assignment.name}
					</Text>
					<Text size='xs' c='dimmed'>
						{course.name}
					</Text>
				</Box>
			</Group>

			<Group gap='md'>
				<Group gap='xs'>
					<ActionIcon
						variant='subtle'
						size='md'
						disabled={!hasPrev}
						onClick={onPrevUser}
					>
						<IconChevronLeft size={18} />
					</ActionIcon>
					<Group gap='sm'>
						{currentUser.dbStudent ? (
							<StudentAvatar
								stdNo={currentUser.dbStudent.stdNo}
								size='sm'
								radius='xl'
							/>
						) : (
							<Avatar src={currentUser.profileimageurl} size='sm' radius='xl' />
						)}
						<Box>
							<Text size='sm' fw={500}>
								{displayName}
							</Text>
							<Text size='xs' c='dimmed'>
								{currentIndex + 1} of {submittedUsers.length} •{' '}
								{currentUser.submission
									? formatDate(currentUser.submission.timemodified)
									: 'No submission'}
							</Text>
						</Box>
					</Group>
					<ActionIcon
						variant='subtle'
						size='md'
						disabled={!hasNext}
						onClick={onNextUser}
					>
						<IconChevronRight size={18} />
					</ActionIcon>
				</Group>
			</Group>

			<Group gap='xs'>
				{currentFileUrl && (
					<>
						<Tooltip label='Download file'>
							<ActionIcon
								variant='subtle'
								size='lg'
								component='a'
								href={currentFileUrl}
								download
							>
								<IconDownload size={20} />
							</ActionIcon>
						</Tooltip>
						<Tooltip label='Open in new tab'>
							<ActionIcon
								variant='subtle'
								size='lg'
								component='a'
								href={currentFileUrl}
								target='_blank'
								rel='noopener noreferrer'
							>
								<IconExternalLink size={20} />
							</ActionIcon>
						</Tooltip>
					</>
				)}
			</Group>
		</Group>
	);
}
