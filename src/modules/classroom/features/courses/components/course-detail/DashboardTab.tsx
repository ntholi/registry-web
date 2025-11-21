'use client';

import {
	Paper,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCoursePosts } from '@/modules/classroom/features/posts';
import { PostCard } from '@/modules/classroom/features/posts/components';

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
	const { data: session } = useSession();
	const { data: posts, isLoading } = useQuery({
		queryKey: ['course-posts', courseId],
		queryFn: () => getCoursePosts(courseId),
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
		<Stack gap='md'>
			{posts.map((post) => (
				<PostCard key={post.id} post={post} currentUserId={session?.user?.id} />
			))}
		</Stack>
	);
}
