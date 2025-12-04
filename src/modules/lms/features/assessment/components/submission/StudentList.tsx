'use client';

import { Avatar, Badge, NavLink, ScrollArea, Stack, Text } from '@mantine/core';
import type { SubmissionUser } from '../../types';

type Props = {
	users: SubmissionUser[];
	selectedUser: SubmissionUser | null;
	onSelectUser: (user: SubmissionUser) => void;
};

export default function StudentList({
	users,
	selectedUser,
	onSelectUser,
}: Props) {
	const submittedUsers = users.filter(
		(u) => u.submission && u.submission.status === 'submitted'
	);
	const notSubmittedUsers = users.filter(
		(u) => !u.submission || u.submission.status !== 'submitted'
	);

	return (
		<ScrollArea h='calc(100vh - 350px)' type='auto'>
			<Stack gap={4}>
				<Text size='xs' fw={600} tt='uppercase' pb='xs'>
					Submitted ({submittedUsers.length})
				</Text>
				{submittedUsers.map((user) => {
					return (
						<NavLink
							key={user.id}
							active={selectedUser?.id === user.id}
							label={user.fullname}
							leftSection={
								<Avatar src={user.profileimageurl} size='sm' radius='xl' />
							}
							onClick={() => onSelectUser(user)}
						/>
					);
				})}

				{notSubmittedUsers.length > 0 && (
					<>
						<Text size='xs' fw={600} tt='uppercase' pt='md' pb='xs'>
							Not Submitted ({notSubmittedUsers.length})
						</Text>
						{notSubmittedUsers.map((user) => (
							<NavLink
								key={user.id}
								active={selectedUser?.id === user.id}
								label={user.fullname}
								leftSection={
									<Avatar src={user.profileimageurl} size='sm' radius='xl' />
								}
								rightSection={
									<Badge size='xs' variant='light' color='gray'>
										-
									</Badge>
								}
								onClick={() => onSelectUser(user)}
							/>
						))}
					</>
				)}
			</Stack>
		</ScrollArea>
	);
}
