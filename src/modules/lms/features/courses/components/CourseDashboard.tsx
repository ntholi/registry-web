'use client';

import { getCourseAssignments } from '@lms/assessment';
import { getForumDiscussions, getMainForum } from '@lms/forum';
import {
	Avatar,
	Box,
	Divider,
	Grid,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import {
	IconCalendarEvent,
	IconClipboardCheck,
	IconMessage,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import type { MoodleCourse } from '../types';

type CourseDashboardProps = {
	course: MoodleCourse;
};

type AssignmentDueDate = {
	id: number;
	name: string;
	duedate: number;
};

function UpcomingAssessmentCard({
	assignment,
}: {
	assignment: AssignmentDueDate;
}) {
	const dueDate = new Date(assignment.duedate * 1000);
	const isOverdue = dueDate < new Date();
	const daysUntilDue = Math.ceil(
		(dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
	);

	return (
		<Paper withBorder p='sm' radius='sm'>
			<Group justify='space-between' wrap='nowrap'>
				<Group gap='sm' wrap='nowrap' style={{ flex: 1, minWidth: 0 }}>
					<ThemeIcon
						color={isOverdue ? 'red' : daysUntilDue <= 3 ? 'orange' : 'blue'}
						variant='light'
						size='md'
						radius='sm'
					>
						<IconClipboardCheck size={16} />
					</ThemeIcon>
					<div style={{ minWidth: 0 }}>
						<Text size='sm' fw={500} truncate>
							{assignment.name}
						</Text>
						<Text size='xs' c={isOverdue ? 'red' : 'dimmed'}>
							{isOverdue
								? 'Overdue'
								: daysUntilDue === 0
									? 'Due today'
									: daysUntilDue === 1
										? 'Due tomorrow'
										: `Due in ${daysUntilDue} days`}
						</Text>
					</div>
				</Group>
			</Group>
		</Paper>
	);
}

function RecentDiscussionCard({
	discussion,
}: {
	discussion: {
		id: number;
		subject: string;
		userfullname: string;
		userpictureurl: string;
		created: number;
		numreplies: number;
	};
}) {
	return (
		<Paper withBorder p='sm' radius='sm'>
			<Group gap='sm' wrap='nowrap'>
				<Avatar
					src={discussion.userpictureurl}
					size='sm'
					radius='xl'
					alt={discussion.userfullname}
				/>
				<div style={{ flex: 1, minWidth: 0 }}>
					<Text size='sm' fw={500} truncate>
						{discussion.subject}
					</Text>
					<Group gap='xs'>
						<Text size='xs' c='dimmed'>
							{discussion.userfullname}
						</Text>
						<Text size='xs' c='dimmed'>
							·
						</Text>
						<Text size='xs' c='dimmed'>
							{dayjs(discussion.created * 1000).fromNow()}
						</Text>
						{discussion.numreplies > 0 && (
							<>
								<Text size='xs' c='dimmed'>
									·
								</Text>
								<Group gap={4}>
									<IconMessage size={12} />
									<Text size='xs' c='dimmed'>
										{discussion.numreplies}
									</Text>
								</Group>
							</>
						)}
					</Group>
				</div>
			</Group>
		</Paper>
	);
}

function AssessmentCalendar({
	assignments,
	isLoading,
}: {
	assignments: AssignmentDueDate[] | undefined;
	isLoading: boolean;
}) {
	const dueDates = assignments?.map((a) => dayjs(a.duedate * 1000)) ?? [];

	return (
		<Paper withBorder p='md' radius='md'>
			<Group mb='md' gap='xs'>
				<IconCalendarEvent size={20} />
				<Text fw={600}>Calendar</Text>
			</Group>
			{isLoading ? (
				<Stack align='center' py='xl'>
					<Skeleton height={250} width='100%' radius='md' />
				</Stack>
			) : (
				<Calendar
					static
					getDayProps={(date) => {
						const hasAssignment = dueDates.some((d) =>
							dayjs(date).isSame(d, 'day')
						);
						const isPast = dayjs(date).isBefore(dayjs(), 'day');
						return {
							style: hasAssignment
								? {
										backgroundColor: isPast
											? 'var(--mantine-color-red-1)'
											: 'var(--mantine-color-blue-1)',
										borderRadius: 'var(--mantine-radius-sm)',
									}
								: undefined,
						};
					}}
					renderDay={(date) => {
						const day = dayjs(date).date();
						const hasAssignment = dueDates.some((d) =>
							dayjs(date).isSame(d, 'day')
						);
						return (
							<Box pos='relative'>
								<div>{day}</div>
								{hasAssignment && (
									<Box
										pos='absolute'
										bottom={-2}
										left='50%'
										style={{ transform: 'translateX(-50%)' }}
									>
										<Box
											w={4}
											h={4}
											bg='blue'
											style={{ borderRadius: '50%' }}
										/>
									</Box>
								)}
							</Box>
						);
					}}
				/>
			)}
			<Divider my='md' />
			<Group gap='md' justify='center'>
				<Group gap={6}>
					<Box w={10} h={10} bg='blue.1' style={{ borderRadius: 2 }} />
					<Text size='xs' c='dimmed'>
						Upcoming
					</Text>
				</Group>
				<Group gap={6}>
					<Box w={10} h={10} bg='red.1' style={{ borderRadius: 2 }} />
					<Text size='xs' c='dimmed'>
						Past Due
					</Text>
				</Group>
			</Group>
		</Paper>
	);
}

export default function CourseDashboard({ course }: CourseDashboardProps) {
	const { data: assignments, isLoading: assignmentsLoading } = useQuery({
		queryKey: ['course-assignments', course.id],
		queryFn: () => getCourseAssignments(course.id),
	});

	const { data: forum } = useQuery({
		queryKey: ['forum', course.id],
		queryFn: () => getMainForum(course.id),
	});

	const { data: discussions, isLoading: discussionsLoading } = useQuery({
		queryKey: ['forum-discussions', forum?.id],
		queryFn: () =>
			forum ? getForumDiscussions(forum.id) : Promise.resolve([]),
		enabled: !!forum,
	});

	const upcomingAssignments =
		assignments
			?.filter((a) => a.duedate > 0)
			.sort((a, b) => a.duedate - b.duedate)
			.slice(0, 5) ?? [];

	const recentDiscussions = discussions?.slice(0, 4) ?? [];

	return (
		<Stack gap='lg' mt={'lg'} px={'md'}>
			<Grid>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Stack gap='md'>
						<Paper withBorder p='md' radius='md'>
							<Group mb='md' justify='space-between'>
								<Group gap='xs'>
									<IconClipboardCheck size={20} />
									<Text fw={600}>Upcoming Assessments</Text>
								</Group>
							</Group>
							{assignmentsLoading ? (
								<Stack gap='sm'>
									{[1, 2, 3].map((i) => (
										<Skeleton key={i} height={56} radius='sm' />
									))}
								</Stack>
							) : upcomingAssignments.length === 0 ? (
								<Text size='sm' c='dimmed' ta='center' py='md'>
									No upcoming assessments
								</Text>
							) : (
								<Stack gap='sm'>
									{upcomingAssignments.map((assignment) => (
										<UpcomingAssessmentCard
											key={assignment.id}
											assignment={assignment}
										/>
									))}
								</Stack>
							)}
						</Paper>

						<Paper withBorder p='md' radius='md'>
							<Group mb='md' justify='space-between'>
								<Group gap='xs'>
									<IconMessage size={20} />
									<Text fw={600}>Recent Discussions</Text>
								</Group>
							</Group>
							{discussionsLoading ? (
								<Stack gap='sm'>
									{[1, 2, 3].map((i) => (
										<Skeleton key={i} height={56} radius='sm' />
									))}
								</Stack>
							) : recentDiscussions.length === 0 ? (
								<Text size='sm' c='dimmed' ta='center' py='md'>
									No discussions yet
								</Text>
							) : (
								<Stack gap='sm'>
									{recentDiscussions.map((discussion) => (
										<RecentDiscussionCard
											key={discussion.id}
											discussion={discussion}
										/>
									))}
								</Stack>
							)}
						</Paper>
					</Stack>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 4 }}>
					<AssessmentCalendar
						assignments={upcomingAssignments}
						isLoading={assignmentsLoading}
					/>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
