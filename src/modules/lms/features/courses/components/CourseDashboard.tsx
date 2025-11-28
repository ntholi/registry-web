'use client';

import { getCourseAssignments } from '@lms/assessment';
import { getForumDiscussions, getMainForum } from '@lms/forum';
import {
	Avatar,
	Badge,
	Box,
	Divider,
	Grid,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import {
	IconCalendarEvent,
	IconClipboardCheck,
	IconMessageCircle,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import Link from 'next/link';
import type { MoodleCourse } from '../types';

type CourseDashboardProps = {
	course: MoodleCourse;
};

type AssignmentDueDate = {
	id: number;
	name: string;
	duedate: number;
};

function AssessmentCard({
	assignment,
	isLast,
	courseId,
}: {
	assignment: AssignmentDueDate;
	isLast: boolean;
	courseId: number;
}) {
	const dueDate = new Date(assignment.duedate * 1000);
	const isOverdue = dueDate < new Date();
	const daysUntilDue = Math.ceil(
		(dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
	);

	const statusText = isOverdue
		? 'Overdue'
		: daysUntilDue === 0
			? 'Today'
			: daysUntilDue === 1
				? 'Tomorrow'
				: `${daysUntilDue} days`;

	return (
		<>
			<Box
				component={Link}
				href={`/lms/courses/${courseId}/assessments/${assignment.id}`}
				style={{
					textDecoration: 'none',
					color: 'inherit',
					display: 'block',
					transition: 'background-color 0.2s ease',
					cursor: 'pointer',
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.backgroundColor =
						'light-dark(rgba(0, 0, 0, 0.02), rgba(255, 255, 255, 0.03))';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.backgroundColor = 'transparent';
				}}
			>
				<Group gap='sm' wrap='nowrap' py='sm'>
					<Box
						w={3}
						h={32}
						bg={isOverdue ? 'red.5' : 'blue.5'}
						style={{ borderRadius: 2, flexShrink: 0 }}
					/>
					<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
						<Text size='sm' fw={500} truncate>
							{assignment.name}
						</Text>
						<Text size='xs' c='dimmed'>
							{dayjs(dueDate).format('D MMM YYYY')}
						</Text>
					</Stack>
					<Badge
						variant='light'
						color={isOverdue ? 'red' : 'blue'}
						size='sm'
						style={{ flexShrink: 0 }}
					>
						{statusText}
					</Badge>
				</Group>
			</Box>
			{!isLast && <Divider />}
		</>
	);
}

function RecentDiscussionCard({
	discussion,
	isLast,
}: {
	discussion: {
		id: number;
		subject: string;
		userfullname: string;
		userpictureurl: string;
		created: number;
		numreplies: number;
	};
	isLast: boolean;
}) {
	return (
		<Group
			gap='sm'
			wrap='nowrap'
			py='sm'
			style={
				!isLast
					? { borderBottom: '1px solid var(--mantine-color-gray-2)' }
					: undefined
			}
		>
			<Avatar
				src={discussion.userpictureurl}
				size='sm'
				radius='xl'
				alt={discussion.userfullname}
			/>
			<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
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
								<IconMessageCircle size={12} />
								<Text size='xs' c='dimmed'>
									{discussion.numreplies}
								</Text>
							</Group>
						</>
					)}
				</Group>
			</Stack>
		</Group>
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
									<Text fw={600}>Assessments</Text>
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
								<Stack gap={0}>
									{upcomingAssignments.map((assignment, index) => (
										<AssessmentCard
											key={assignment.id}
											assignment={assignment}
											isLast={index === upcomingAssignments.length - 1}
											courseId={course.id}
										/>
									))}
								</Stack>
							)}
						</Paper>

						<Paper withBorder p='md' radius='md'>
							<Group mb='md' justify='space-between'>
								<Group gap='xs'>
									<IconMessageCircle size={20} />
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
								<Stack gap={0}>
									{recentDiscussions.map((discussion, index) => (
										<RecentDiscussionCard
											key={discussion.id}
											discussion={discussion}
											isLast={index === recentDiscussions.length - 1}
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
