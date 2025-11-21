'use client';

import {
	Avatar,
	Box,
	Card,
	Group,
	Stack,
	Text,
	ActionIcon,
	Divider,
	Tooltip,
} from '@mantine/core';
import {
	IconMessage,
	IconDots,
	IconTrash,
	IconEdit,
} from '@tabler/icons-react';
import { useState } from 'react';
import ReplySection from './ReplySection';

type User = {
	id: string;
	name: string | null;
	image: string | null;
};

type Reply = {
	id: number;
	content: string;
	createdAt: Date | null;
	user: User;
};

type Post = {
	id: number;
	content: string;
	createdAt: Date | null;
	user: User;
	replies?: Reply[];
};

type Props = {
	post: Post;
	currentUserId?: string;
	onDelete?: (id: number) => void;
	onEdit?: (id: number) => void;
};

function formatTimeAgo(date: Date | null) {
	if (!date) return '';
	const now = new Date();
	const diffMs = now.getTime() - new Date(date).getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;

	return new Date(date).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: diffDays > 365 ? 'numeric' : undefined,
	});
}

export default function PostCard({
	post,
	currentUserId,
	onDelete,
	onEdit,
}: Props) {
	const [showReplies, setShowReplies] = useState(false);
	const [showActions, setShowActions] = useState(false);

	const isAuthor = currentUserId === post.user.id;
	const replyCount = post.replies?.length || 0;

	return (
		<Card
			shadow='xs'
			padding='lg'
			radius='md'
			withBorder
			onMouseEnter={() => setShowActions(true)}
			onMouseLeave={() => setShowActions(false)}
			style={{
				transition: 'box-shadow 0.2s ease',
			}}
			styles={{
				root: {
					'&:hover': {
						boxShadow: 'var(--mantine-shadow-md)',
					},
				},
			}}
		>
			<Stack gap='md'>
				<Group justify='space-between' wrap='nowrap'>
					<Group gap='sm' wrap='nowrap'>
						<Avatar
							src={post.user.image}
							alt={post.user.name || 'User'}
							radius='xl'
							size='md'
							color='blue'
						>
							{post.user.name?.[0]?.toUpperCase()}
						</Avatar>
						<div>
							<Text size='sm' fw={600}>
								{post.user.name || 'Unknown User'}
							</Text>
							<Text size='xs' c='dimmed'>
								{formatTimeAgo(post.createdAt)}
							</Text>
						</div>
					</Group>

					{isAuthor && showActions && (
						<Group gap={4}>
							{onEdit && (
								<Tooltip label='Edit'>
									<ActionIcon
										variant='subtle'
										color='gray'
										size='sm'
										onClick={() => onEdit(post.id)}
									>
										<IconEdit size={16} />
									</ActionIcon>
								</Tooltip>
							)}
							{onDelete && (
								<Tooltip label='Delete'>
									<ActionIcon
										variant='subtle'
										color='red'
										size='sm'
										onClick={() => onDelete(post.id)}
									>
										<IconTrash size={16} />
									</ActionIcon>
								</Tooltip>
							)}
							<ActionIcon variant='subtle' color='gray' size='sm'>
								<IconDots size={16} />
							</ActionIcon>
						</Group>
					)}
				</Group>

				<Box>
					<Text size='sm' style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
						{post.content}
					</Text>
				</Box>

				<Divider />

				<Group gap='xs'>
					<ActionIcon
						variant={showReplies ? 'light' : 'subtle'}
						color={showReplies ? 'blue' : 'gray'}
						size='sm'
						onClick={() => setShowReplies(!showReplies)}
					>
						<IconMessage size={16} />
					</ActionIcon>
					<Text
						size='xs'
						c='dimmed'
						onClick={() => setShowReplies(!showReplies)}
						style={{ cursor: 'pointer' }}
					>
						{replyCount === 0
							? 'Reply'
							: `${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}`}
					</Text>
				</Group>

				{showReplies && (
					<ReplySection postId={post.id} replies={post.replies || []} />
				)}
			</Stack>
		</Card>
	);
}
