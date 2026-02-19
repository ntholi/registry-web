'use client';

import {
	ActionIcon,
	Avatar,
	Badge,
	Box,
	Collapse,
	Divider,
	Group,
	Menu,
	Paper,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import {
	IconBellRinging,
	IconChevronDown,
	IconChevronUp,
	IconDotsVertical,
	IconEdit,
	IconExternalLink,
	IconMessageCircle,
	IconMessages,
	IconPin,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getPostTypeColor } from '@/shared/lib/utils/colors';
import {
	deletePost,
	getAllPosts,
	getDiscussionPosts,
} from '../_server/actions';
import type { MoodleDiscussion, MoodlePost, PostType } from '../types';

type PostsListProps = {
	courseId: number;
};

function PostSkeleton() {
	return (
		<Paper p='lg' radius='md' withBorder>
			<Stack gap='md'>
				<Group gap='sm' wrap='nowrap'>
					<Skeleton height={44} width={44} radius='xl' />
					<Stack gap={6} style={{ flex: 1 }}>
						<Group gap='xs'>
							<Skeleton height={14} width={100} />
							<Skeleton height={20} width={80} radius='xl' />
						</Group>
						<Skeleton height={12} width={120} />
					</Stack>
				</Group>
				<Skeleton height={18} width='80%' />
				<Skeleton height={60} />
			</Stack>
		</Paper>
	);
}

type ReplyCardProps = {
	reply: MoodlePost;
};

function ReplyCard({ reply }: ReplyCardProps) {
	return (
		<Paper p='md' radius='sm' bg='var(--mantine-color-dark-7)'>
			<Stack gap='sm'>
				<Group gap='sm' wrap='nowrap'>
					<Avatar
						src={reply.userpictureurl}
						radius='xl'
						size='sm'
						alt={reply.userfullname}
					/>
					<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
						<Text fw={500} size='sm'>
							{reply.userfullname}
						</Text>
						<Text size='xs' c='dimmed'>
							{formatDistanceToNow(new Date(reply.created * 1000), {
								addSuffix: true,
							})}
						</Text>
					</Stack>
				</Group>
				<Box
					dangerouslySetInnerHTML={{ __html: reply.message }}
					fz='sm'
					lh={1.6}
					className='post-content'
				/>
			</Stack>
		</Paper>
	);
}

type RepliesSectionProps = {
	discussionId: number;
	numReplies: number;
};

function RepliesSection({ discussionId, numReplies }: RepliesSectionProps) {
	const [opened, { toggle }] = useDisclosure(false);

	const { data: posts, isLoading } = useQuery({
		queryKey: ['discussion-posts', discussionId],
		queryFn: () => getDiscussionPosts(discussionId),
		enabled: opened,
	});

	const replies = posts?.filter((p) => p.id !== discussionId) || [];

	return (
		<Stack gap='sm'>
			<UnstyledButton onClick={toggle}>
				<Group gap='xs'>
					<ThemeIcon size='sm' variant='subtle' color='gray'>
						{opened ? (
							<IconChevronUp size={14} />
						) : (
							<IconChevronDown size={14} />
						)}
					</ThemeIcon>
					<Text size='sm' c='dimmed'>
						{numReplies} {numReplies === 1 ? 'reply' : 'replies'}
					</Text>
				</Group>
			</UnstyledButton>
			<Collapse in={opened}>
				<Stack gap='sm' pl='md'>
					{isLoading ? (
						<Stack gap='sm'>
							{[1, 2].map((i) => (
								<Paper
									key={i}
									p='md'
									radius='sm'
									bg='var(--mantine-color-dark-7)'
								>
									<Stack gap='sm'>
										<Group gap='sm'>
											<Skeleton height={32} width={32} radius='xl' />
											<Stack gap={4}>
												<Skeleton height={12} width={80} />
												<Skeleton height={10} width={60} />
											</Stack>
										</Group>
										<Skeleton height={40} />
									</Stack>
								</Paper>
							))}
						</Stack>
					) : replies.length > 0 ? (
						replies.map((reply) => <ReplyCard key={reply.id} reply={reply} />)
					) : (
						<Text size='sm' c='dimmed' fs='italic'>
							No replies yet
						</Text>
					)}
				</Stack>
			</Collapse>
		</Stack>
	);
}

type PostCardProps = {
	post: MoodleDiscussion;
	type: PostType;
	courseId: number;
};

function PostCard({ post, type, courseId }: PostCardProps) {
	const isAnnouncement = type === 'announcement';
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: () => deletePost(post.discussion),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['course-posts', courseId] });
		},
	});

	function handleDelete() {
		modals.openConfirmModal({
			title: `Delete ${isAnnouncement ? 'Announcement' : 'Discussion'}`,
			children: (
				<Text size='sm'>
					Are you sure you want to delete "{post.subject}"? This action cannot
					be undone.
				</Text>
			),
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () => deleteMutation.mutate(),
		});
	}

	function handleViewInMoodle() {
		const moodleUrl = process.env.NEXT_PUBLIC_MOODLE_URL;
		window.open(
			`${moodleUrl}/mod/forum/discuss.php?d=${post.discussion}`,
			'_blank'
		);
	}

	return (
		<Paper p='lg' radius='md' withBorder>
			<Group gap='sm' wrap='nowrap' align='flex-start'>
				<Avatar
					src={post.userpictureurl}
					radius='xl'
					size={44}
					alt={post.userfullname}
				/>
				<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
					<Group gap='xs' wrap='wrap'>
						<Text fw={600} size='sm'>
							{post.userfullname}
						</Text>

						{post.pinned && (
							<Badge
								size='xs'
								variant='outline'
								color='yellow'
								leftSection={<IconPin size={10} />}
							>
								Pinned
							</Badge>
						)}
					</Group>
					<Group>
						<Text size='xs' c='dimmed'>
							{formatDistanceToNow(new Date(post.created * 1000), {
								addSuffix: true,
							})}
						</Text>
						<Badge
							size='xs'
							variant='transparent'
							c={'gray'}
							radius={'xs'}
							color={getPostTypeColor(type)}
							leftSection={
								isAnnouncement ? (
									<IconBellRinging size={10} />
								) : (
									<IconMessages size={10} />
								)
							}
						>
							{isAnnouncement ? 'Announcement' : 'Discussion'}
						</Badge>
					</Group>
				</Stack>
				<Menu position='bottom-end' withArrow shadow='md'>
					<Menu.Target>
						<ActionIcon variant='subtle' color='gray' size='sm'>
							<IconDotsVertical size={16} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Item leftSection={<IconEdit size={14} />} disabled>
							Edit
						</Menu.Item>
						<Menu.Item
							leftSection={<IconExternalLink size={14} />}
							onClick={handleViewInMoodle}
						>
							View in Moodle
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item
							leftSection={<IconTrash size={14} />}
							color='red'
							onClick={handleDelete}
						>
							Delete
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Group>

			<Text fw={500} size='md' mt='md'>
				{post.subject}
			</Text>

			<Box
				dangerouslySetInnerHTML={{ __html: post.message }}
				fz='sm'
				c='dimmed'
				className='post-content'
			/>

			{!isAnnouncement && post.numreplies > 0 && (
				<>
					<Divider my='sm' />
					<RepliesSection
						discussionId={post.discussion}
						numReplies={post.numreplies}
					/>
				</>
			)}

			{!isAnnouncement && post.numreplies === 0 && (
				<Group gap='xs' c='dimmed'>
					<IconMessageCircle size={16} stroke={1.5} />
					<Text size='sm'>No replies yet</Text>
				</Group>
			)}
		</Paper>
	);
}

export default function PostsList({ courseId }: PostsListProps) {
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

	const combinedPosts: Array<{ post: MoodleDiscussion; type: PostType }> = [];

	const pinnedAnnouncements = (data?.announcements || []).filter(
		(p) => p.pinned
	);
	const pinnedDiscussions = (data?.discussions || []).filter((p) => p.pinned);
	const unpinnedAnnouncements = (data?.announcements || []).filter(
		(p) => !p.pinned
	);
	const unpinnedDiscussions = (data?.discussions || []).filter(
		(p) => !p.pinned
	);

	pinnedAnnouncements.forEach((post) => {
		combinedPosts.push({ post, type: 'announcement' });
	});
	pinnedDiscussions.forEach((post) => {
		combinedPosts.push({ post, type: 'discussion' });
	});

	const allUnpinned = [
		...unpinnedAnnouncements.map((post) => ({
			post,
			type: 'announcement' as PostType,
		})),
		...unpinnedDiscussions.map((post) => ({
			post,
			type: 'discussion' as PostType,
		})),
	].sort((a, b) => b.post.created - a.post.created);

	combinedPosts.push(...allUnpinned);

	if (combinedPosts.length === 0) {
		return (
			<Paper p='xl' radius='md' withBorder>
				<Stack align='center' gap='md'>
					<ThemeIcon size={64} radius='xl' variant='light' color='gray'>
						<IconMessages size={32} />
					</ThemeIcon>
					<Stack align='center' gap='xs'>
						<Text c='dimmed' size='lg' fw={500}>
							No posts yet
						</Text>
						<Text c='dimmed' size='sm'>
							Announcements and discussions will appear here
						</Text>
					</Stack>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			{combinedPosts.map(({ post, type }) => (
				<PostCard
					key={`${type}-${post.id}`}
					post={post}
					type={type}
					courseId={courseId}
				/>
			))}
		</Stack>
	);
}
