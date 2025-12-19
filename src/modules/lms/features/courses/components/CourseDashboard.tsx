'use client';

import { getCourseAssignments } from '@lms/assignments';
import { getAllPosts } from '@lms/posts';
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
import { getBooleanColor } from '@student-portal/utils';
import { IconClipboardCheck, IconMessageCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import Link from 'next/link';
import type { MoodleCourse } from '../types';
import DashboardCalendar from './DashboardCalendar';

type CourseDashboardProps = {
	course: MoodleCourse;
};

type AssignmentDueDate = {
	id: number;
	name: string;
	duedate: number;
};

function AssignmentCard({
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
				href={`/lms/courses/${courseId}/assignments/${assignment.id}`}
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
						bg={`${getBooleanColor(isOverdue, 'negative')}.5`}
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
						color={getBooleanColor(isOverdue, 'negative')}
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

export default function CourseDashboard({ course }: CourseDashboardProps) {
	const { data: assignments, isLoading: assignmentsLoading } = useQuery({
		queryKey: ['course-assignments', course.id],
		queryFn: () => getCourseAssignments(course.id),
	});

	const { data: postsData, isLoading: discussionsLoading } = useQuery({
		queryKey: ['course-posts', course.id],
		queryFn: () => getAllPosts(course.id),
	});

	const upcomingAssignments =
		assignments
			?.filter((a) => a.duedate > 0)
			.sort((a, b) => a.duedate - b.duedate)
			.slice(0, 5) ?? [];

	const recentDiscussions = postsData?.discussions?.slice(0, 4) ?? [];

	return (
		<Stack gap='lg' mt={'lg'} px={'md'}>
			<Grid>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Stack gap='md'>
						<Paper withBorder p='md' radius='md'>
							<Group mb='md' justify='space-between'>
								<Group gap='xs'>
									<IconClipboardCheck size={20} />
									<Text fw={600}>Assignments</Text>
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
									No upcoming assignments
								</Text>
							) : (
								<Stack gap={0}>
									{upcomingAssignments.map((assignment, index) => (
										<AssignmentCard
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
					<DashboardCalendar
						assignments={upcomingAssignments}
						isLoading={assignmentsLoading}
					/>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
