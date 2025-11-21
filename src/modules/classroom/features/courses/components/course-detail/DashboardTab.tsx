'use client';

import { Paper, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getCourseAnnouncements } from '../../server/actions';
import ForumPost from './ForumPost';

type Props = {
	courseId: string;
};

function DashboardSkeleton() {
	return (
		<Stack gap='lg'>
			{[0, 1, 2].map((i) => (
				<Skeleton key={i} height={150} radius='lg' />
			))}
		</Stack>
	);
}

export default function DashboardTab({ courseId }: Props) {
	const { data: posts, isLoading } = useQuery({
		queryKey: ['course-announcements', courseId],
		queryFn: () => getCourseAnnouncements(courseId),
	});

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	if (!posts || posts.length === 0) {
		return (
			<Paper p='xl' radius='md' withBorder>
				<Stack align='center' gap='md'>
					<ThemeIcon size={48} radius='xl' variant='light' color='gray'>
						<IconMessage size={24} />
					</ThemeIcon>
					<Text c='dimmed' ta='center'>
						No posts yet
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='lg'>
			{posts.map((post) => (
				<ForumPost key={post.id} post={post} courseId={courseId} />
			))}
		</Stack>
	);
}
