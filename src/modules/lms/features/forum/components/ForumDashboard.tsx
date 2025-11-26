'use client';

import { Box, Group, Loader, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getMainForum } from '../server/actions';
import ForumPostForm from './ForumPostForm';
import ForumPostsList from './ForumPostsList';

type ForumDashboardProps = {
	courseId: number;
};

export default function ForumDashboard({ courseId }: ForumDashboardProps) {
	const { data: forum, isLoading } = useQuery({
		queryKey: ['main-forum', courseId],
		queryFn: () => getMainForum(courseId),
	});

	if (isLoading) {
		return (
			<Box ta='center' py='xl'>
				<Loader />
			</Box>
		);
	}

	if (!forum) {
		return (
			<Box ta='center' py='xl'>
				<Text c='dimmed'>No forum available for this course</Text>
			</Box>
		);
	}

	return (
		<Box>
			<Group justify='space-between' mb='xl'>
				<Title order={3}>{forum.name}</Title>
				<ForumPostForm forumId={forum.id} />
			</Group>

			<ForumPostsList forumId={forum.id} />
		</Box>
	);
}
