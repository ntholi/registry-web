'use client';

import {
	Avatar,
	Badge,
	Group,
	NavLink,
	ScrollArea,
	Stack,
	Text,
} from '@mantine/core';
import { getPercentageColor } from '@student-portal/utils';
import StudentAvatar from '@/modules/lms/shared/StudentAvatar';
import type { QuizSubmissionUser } from '../../types';

type Props = {
	users: QuizSubmissionUser[];
	selectedUser: QuizSubmissionUser | null;
	onSelectUser: (user: QuizSubmissionUser) => void;
	maxGrade: number;
};

function getGradeColorFromMark(grade: number | null, maxGrade: number): string {
	if (grade === null) return 'gray';
	const percentage = (grade / maxGrade) * 100;
	return getPercentageColor(percentage);
}

function formatGrade(grade: number | null, maxGrade: number): string {
	if (grade === null) return '-';
	return `${grade.toFixed(1)}/${maxGrade}`;
}

export default function QuizStudentList({
	users,
	selectedUser,
	onSelectUser,
	maxGrade,
}: Props) {
	const attemptedUsers = users.filter((u) => u.attempts.length > 0);
	const notAttemptedUsers = users.filter((u) => u.attempts.length === 0);

	return (
		<ScrollArea>
			<Stack gap={4}>
				<Text size='xs' fw={600} tt='uppercase' pb='xs'>
					Attempted ({attemptedUsers.length})
				</Text>
				{attemptedUsers.map((user) => {
					const bestGrade = user.bestAttempt?.sumgrades ?? null;
					const displayName = user.dbStudent?.name ?? user.fullname;
					const hasNeedsGrading = user.attempts.some(
						(a) => a.state === 'finished' && a.sumgrades === null
					);

					return (
						<NavLink
							key={user.id}
							active={selectedUser?.id === user.id}
							label={displayName}
							description={
								<Group gap={4}>
									<Text size='xs' c='dimmed'>
										{user.attempts.length} attempt
										{user.attempts.length !== 1 ? 's' : ''}
									</Text>
									{hasNeedsGrading && (
										<Badge size='xs' color='orange' variant='light'>
											Needs Grading
										</Badge>
									)}
								</Group>
							}
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
								<Badge
									size='sm'
									variant='light'
									color={getGradeColorFromMark(bestGrade, maxGrade)}
								>
									{formatGrade(bestGrade, maxGrade)}
								</Badge>
							}
							onClick={() => onSelectUser(user)}
						/>
					);
				})}

				{notAttemptedUsers.length > 0 && (
					<>
						<Text size='xs' fw={600} tt='uppercase' pt='md' pb='xs'>
							Not Attempted ({notAttemptedUsers.length})
						</Text>
						{notAttemptedUsers.map((user) => (
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
