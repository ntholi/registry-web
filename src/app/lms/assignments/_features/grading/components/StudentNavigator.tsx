'use client';

import {
	ActionIcon,
	Avatar,
	Badge,
	Group,
	NavLink,
	ScrollArea,
	Stack,
	Text,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import StudentAvatar from '@/modules/lms/shared/StudentAvatar';
import type { SubmissionUser } from '../../../types';

type Props = {
	users: SubmissionUser[];
	currentUserId: number;
	courseId: number;
	assignmentId: number;
};

export default function StudentNavigator({
	users,
	currentUserId,
	courseId,
	assignmentId,
}: Props) {
	const router = useRouter();

	const submittedUsers = users.filter(
		(u) => u.submission && u.submission.status === 'submitted'
	);

	const currentIndex = submittedUsers.findIndex((u) => u.id === currentUserId);
	const prevUser = currentIndex > 0 ? submittedUsers[currentIndex - 1] : null;
	const nextUser =
		currentIndex < submittedUsers.length - 1
			? submittedUsers[currentIndex + 1]
			: null;

	function navigateToUser(userId: number) {
		router.push(
			`/lms/courses/${courseId}/assignments/${assignmentId}/submission/${userId}`
		);
	}

	return (
		<Stack gap='md' h='100%'>
			<Group justify='space-between'>
				<Text size='xs' fw={600} tt='uppercase'>
					Students ({currentIndex + 1}/{submittedUsers.length})
				</Text>
				<Group gap='xs'>
					<ActionIcon
						variant='subtle'
						size='sm'
						disabled={!prevUser}
						onClick={() => prevUser && navigateToUser(prevUser.id)}
					>
						<IconChevronLeft size={16} />
					</ActionIcon>
					<ActionIcon
						variant='subtle'
						size='sm'
						disabled={!nextUser}
						onClick={() => nextUser && navigateToUser(nextUser.id)}
					>
						<IconChevronRight size={16} />
					</ActionIcon>
				</Group>
			</Group>

			<ScrollArea h='calc(100vh - 200px)' type='auto'>
				<Stack gap={4}>
					{submittedUsers.map((user) => (
						<NavLink
							key={user.id}
							active={user.id === currentUserId}
							label={user.dbStudent?.name ?? user.fullname}
							leftSection={
								user.dbStudent ? (
									<StudentAvatar
										stdNo={user.dbStudent.stdNo}
										size='sm'
										radius='xl'
									/>
								) : (
									<Avatar src={user.profileimageurl} size='sm' radius='xl' />
								)
							}
							rightSection={
								user.submission?.status === 'submitted' ? (
									<Badge size='xs' variant='light' color='green'>
										✓
									</Badge>
								) : null
							}
							onClick={() => navigateToUser(user.id)}
						/>
					))}
				</Stack>
			</ScrollArea>
		</Stack>
	);
}
