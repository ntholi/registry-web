'use client';

import { Box, Group, Title } from '@mantine/core';
import PostForm from './PostForm';
import PostsList from './PostsList';

type PostsDashboardProps = {
	courseId: number;
};

export default function PostsDashboard({ courseId }: PostsDashboardProps) {
	return (
		<Box>
			<Group justify='space-between' mb='xl'>
				<Title order={3}>Posts</Title>
				<PostForm courseId={courseId} />
			</Group>

			<PostsList courseId={courseId} />
		</Box>
	);
}
