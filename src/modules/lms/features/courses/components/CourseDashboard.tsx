'use client';

import { getCourseAssignments } from '@lms/assessment';
import { getForumDiscussions, getMainForum } from '@lms/forum';
import { getEnrolledStudentsFromDB } from '@lms/students';
import {
	Avatar,
	Badge,
	Box,
	Divider,
	Grid,
	Group,
	Paper,
	RingProgress,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import {
	IconBook,
	IconCalendarEvent,
	IconClipboardCheck,
	IconClock,
	IconMessage,
	IconUsers,
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

function StatCard({
	icon,
	label,
	value,
	color,
	isLoading,
}: {
	icon: React.ReactNode;
	label: string;
	value: number | string;
	color: string;
	isLoading?: boolean;
}) {
	return (
		<Paper withBorder p='md' radius='md'>
			<Group justify='space-between'>
				<div>
					<Text c='dimmed' tt='uppercase' fw={700} fz='xs'>
						{label}
					</Text>
					{isLoading ? (
						<Skeleton height={28} width={60} mt={4} />
					) : (
						<Text fw={700} fz='xl'>
							{value}
						</Text>
					)}
				</div>
				<ThemeIcon color={color} variant='light' size={48} radius='md'>
					{icon}
				</ThemeIcon>
			</Group>
		</Paper>
	);
}

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
				<Badge
					size='sm'
					variant='light'
					color={isOverdue ? 'red' : daysUntilDue <= 3 ? 'orange' : 'gray'}
				>
					{dueDate.toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
					})}
				</Badge>
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

function CourseProgressRing({ course }: { course: MoodleCourse }) {
	const progress = course.progress ?? 0;
	const startDate = course.startdate ? new Date(course.startdate * 1000) : null;
	const endDate = course.enddate ? new Date(course.enddate * 1000) : null;

	let timeProgress = 0;
	if (startDate && endDate) {
		const now = Date.now();
		const total = endDate.getTime() - startDate.getTime();
		const elapsed = now - startDate.getTime();
		timeProgress = Math.min(100, Math.max(0, (elapsed / total) * 100));
	}

	return (
		<Paper withBorder p='md' radius='md'>
			<Text fw={600} mb='md'>
				Course Progress
			</Text>
			<Group justify='center' gap='xl'>
				<Stack align='center' gap='xs'>
					<RingProgress
						size={100}
						thickness={8}
						roundCaps
						sections={[{ value: progress, color: 'blue' }]}
						label={
							<Text ta='center' fz='lg' fw={700}>
								{Math.round(progress)}%
							</Text>
						}
					/>
					<Text size='xs' c='dimmed'>
						Completion
					</Text>
				</Stack>
				<Stack align='center' gap='xs'>
					<RingProgress
						size={100}
						thickness={8}
						roundCaps
						sections={[{ value: timeProgress, color: 'teal' }]}
						label={
							<Text ta='center' fz='lg' fw={700}>
								{Math.round(timeProgress)}%
							</Text>
						}
					/>
					<Text size='xs' c='dimmed'>
						Time Elapsed
					</Text>
				</Stack>
			</Group>
			{startDate && endDate && (
				<>
					<Divider my='md' />
					<Group justify='space-between'>
						<div>
							<Text size='xs' c='dimmed'>
								Start Date
							</Text>
							<Text size='sm' fw={500}>
								{startDate.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}
							</Text>
						</div>
						<div style={{ textAlign: 'right' }}>
							<Text size='xs' c='dimmed'>
								End Date
							</Text>
							<Text size='sm' fw={500}>
								{endDate.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}
							</Text>
						</div>
					</Group>
				</>
			)}
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
				<Text fw={600}>Assessment Calendar</Text>
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
	const { data: students, isLoading: studentsLoading } = useQuery({
		queryKey: ['course-students', course.id],
		queryFn: () => getEnrolledStudentsFromDB(course.id),
	});

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

	const overdueCount =
		assignments?.filter((a) => a.duedate > 0 && a.duedate * 1000 < Date.now())
			.length ?? 0;

	const recentDiscussions = discussions?.slice(0, 4) ?? [];

	return (
		<Stack gap='lg'>
			<Grid>
				<Grid.Col span={{ base: 6, md: 3 }}>
					<StatCard
						icon={<IconUsers size={24} />}
						label='Students'
						value={students?.length ?? 0}
						color='blue'
						isLoading={studentsLoading}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 6, md: 3 }}>
					<StatCard
						icon={<IconClipboardCheck size={24} />}
						label='Assessments'
						value={assignments?.length ?? 0}
						color='teal'
						isLoading={assignmentsLoading}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 6, md: 3 }}>
					<StatCard
						icon={<IconClock size={24} />}
						label='Overdue'
						value={overdueCount}
						color={overdueCount > 0 ? 'red' : 'gray'}
						isLoading={assignmentsLoading}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 6, md: 3 }}>
					<StatCard
						icon={<IconMessage size={24} />}
						label='Discussions'
						value={discussions?.length ?? 0}
						color='violet'
						isLoading={discussionsLoading}
					/>
				</Grid.Col>
			</Grid>

			<Grid>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Stack gap='md'>
						<Paper withBorder p='md' radius='md'>
							<Group mb='md' gap='xs'>
								<IconBook size={20} />
								<Text fw={600}>Course Overview</Text>
							</Group>
							{course.summary ? (
								<div
									dangerouslySetInnerHTML={{
										__html: course.summary,
									}}
									style={{ fontSize: '0.875rem', lineHeight: 1.6 }}
								/>
							) : (
								<Text size='sm' c='dimmed'>
									No course description available.
								</Text>
							)}
						</Paper>

						<Paper withBorder p='md' radius='md'>
							<Group mb='md' justify='space-between'>
								<Group gap='xs'>
									<IconClipboardCheck size={20} />
									<Text fw={600}>Upcoming Assessments</Text>
								</Group>
								{upcomingAssignments.length > 0 && (
									<Badge variant='light' color='blue'>
										{upcomingAssignments.length} upcoming
									</Badge>
								)}
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
					<Stack gap='md'>
						<CourseProgressRing course={course} />
						<AssessmentCalendar
							assignments={upcomingAssignments}
							isLoading={assignmentsLoading}
						/>
					</Stack>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
