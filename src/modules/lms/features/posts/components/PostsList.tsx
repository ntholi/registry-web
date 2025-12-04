'use client';

import {
	Avatar,
	Badge,
	Card,
	Divider,
	Group,
	Paper,
	SegmentedControl,
	Skeleton,
	Stack,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { IconBellRinging, IconMessage, IconPin } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { getAllPosts } from '../server/actions';
import type { MoodleDiscussion, PostType } from '../types';

type PostsListProps = {
	courseId: number;
};

function PostSkeleton() {
	return (
		<Card withBorder shadow='xs' padding='lg'>
			<Stack gap='md'>
				<Group gap='md' wrap='nowrap' align='flex-start'>
					<Skeleton height={40} circle />
					<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
						<Group gap='xs' wrap='nowrap'>
							<Skeleton height={16} width={120} />
							<Text c='dimmed' size='xs'>
								·
							</Text>
							<Skeleton height={14} width={80} />
						</Group>
						<Skeleton height={16} width='70%' />
					</Stack>
				</Group>

				<Stack gap='xs'>
					<Skeleton height={14} width='100%' />
					<Skeleton height={14} width='95%' />
					<Skeleton height={14} width='98%' />
				</Stack>

				<Divider />

				<Group gap='xs'>
					<IconMessage size={18} stroke={1.5} style={{ opacity: 0.3 }} />
					<Skeleton height={14} width={60} />
				</Group>
			</Stack>
		</Card>
	);
}

type PostCardProps = {
	post: MoodleDiscussion;
	showReplies?: boolean;
};

function PostCard({ post, showReplies = true }: PostCardProps) {
	return (
		<Card withBorder shadow='xs' padding='lg'>
			<Stack gap='md'>
				<Group gap='md' wrap='nowrap' align='flex-start'>
					<Avatar
						src={post.userpictureurl}
						radius='xl'
						size='md'
						alt={post.userfullname}
					/>
					<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
						<Group gap='xs' wrap='nowrap'>
							<Text fw={600} size='sm'>
								{post.userfullname}
							</Text>
							<Text c='dimmed' size='xs'>
								·
							</Text>
							<Text size='xs' c='dimmed'>
								{formatDistanceToNow(new Date(post.created * 1000), {
									addSuffix: true,
								})}
							</Text>
							{post.pinned && (
								<Badge
									size='xs'
									variant='light'
									color='blue'
									leftSection={<IconPin size={12} />}
								>
									Pinned
								</Badge>
							)}
						</Group>
						<Text fw={500} size='sm' lineClamp={2}>
							{post.subject}
						</Text>
					</Stack>
				</Group>

				<div
					dangerouslySetInnerHTML={{ __html: post.message }}
					style={{
						fontSize: '0.875rem',
						lineHeight: 1.6,
					}}
				/>

				{showReplies && (
					<>
						<Divider />
						<Group gap='xs'>
							<IconMessage size={18} stroke={1.5} style={{ opacity: 0.6 }} />
							<Text size='sm' c='dimmed'>
								{post.numreplies} {post.numreplies === 1 ? 'reply' : 'replies'}
							</Text>
						</Group>
					</>
				)}
			</Stack>
		</Card>
	);
}

export default function PostsList({ courseId }: PostsListProps) {
	const theme = useMantineTheme();
	const [activeTab, setActiveTab] = useState<PostType>('announcement');

	const { data, isLoading } = useQuery({
		queryKey: ['course-posts', courseId],
		queryFn: () => getAllPosts(courseId),
	});

	if (isLoading) {
		return (
			<Stack gap='md'>
				{[1, 2, 3].map((i) => (
					<PostSkeleton key={i} />
				))}
			</Stack>
		);
	}

	const posts =
		activeTab === 'announcement' ? data?.announcements : data?.discussions;
	const emptyMessage =
		activeTab === 'announcement'
			? 'No announcements yet'
			: 'No discussions yet';
	const emptySubtext =
		activeTab === 'announcement'
			? 'Announcements will appear here'
			: 'Be the first to start a conversation';

	return (
		<Stack gap='md'>
			<SegmentedControl
				value={activeTab}
				onChange={(value) => setActiveTab(value as PostType)}
				data={[
					{
						label: (
							<Group gap='xs'>
								<IconBellRinging size={16} />
								<span>Announcements</span>
							</Group>
						),
						value: 'announcement',
					},
					{
						label: (
							<Group gap='xs'>
								<IconMessage size={16} />
								<span>Discussions</span>
							</Group>
						),
						value: 'discussion',
					},
				]}
			/>

			{!posts || posts.length === 0 ? (
				<Paper p='xl' withBorder>
					<Stack align='center' gap='xs'>
						{activeTab === 'announcement' ? (
							<IconBellRinging
								size={48}
								stroke={1.5}
								color={theme.colors.gray[4]}
							/>
						) : (
							<IconMessage
								size={48}
								stroke={1.5}
								color={theme.colors.gray[4]}
							/>
						)}
						<Text c='dimmed' size='lg'>
							{emptyMessage}
						</Text>
						<Text c='dimmed' size='sm'>
							{emptySubtext}
						</Text>
					</Stack>
				</Paper>
			) : (
				<Stack gap='md'>
					{posts.map((post) => (
						<PostCard
							key={post.id}
							post={post}
							showReplies={activeTab === 'discussion'}
						/>
					))}
				</Stack>
			)}
		</Stack>
	);
}
