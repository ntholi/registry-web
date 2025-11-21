'use client';

import {
	Avatar,
	Box,
	Group,
	Stack,
	Text,
	Textarea,
	Button,
	ActionIcon,
	Tooltip,
} from '@mantine/core';
import {
	IconSend,
	IconTrash,
	IconEdit,
	IconDots,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReply, deleteReply } from '../server/actions';
import { notifications } from '@mantine/notifications';

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

type Props = {
	postId: number;
	replies: Reply[];
	currentUserId?: string;
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

export default function ReplySection({ postId, replies, currentUserId }: Props) {
	const [replyText, setReplyText] = useState('');
	const [hoveredReplyId, setHoveredReplyId] = useState<number | null>(null);
	const queryClient = useQueryClient();

	const createReplyMutation = useMutation({
		mutationFn: (content: string) =>
			createReply({
				postId,
				content,
			}),
		onSuccess: () => {
			setReplyText('');
			queryClient.invalidateQueries({ queryKey: ['course-posts'] });
			notifications.show({
				title: 'Success',
				message: 'Reply posted successfully',
				color: 'green',
			});
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to post reply',
				color: 'red',
			});
		},
	});

	const deleteReplyMutation = useMutation({
		mutationFn: (replyId: number) => deleteReply(replyId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['course-posts'] });
			notifications.show({
				title: 'Success',
				message: 'Reply deleted successfully',
				color: 'green',
			});
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to delete reply',
				color: 'red',
			});
		},
	});

	function handleSubmit() {
		if (!replyText.trim()) return;
		createReplyMutation.mutate(replyText);
	}

	return (
		<Stack gap='md' mt='sm'>
			<Box
				pl='md'
				style={{
					borderLeft: '2px solid var(--mantine-color-gray-3)',
				}}
			>
				<Stack gap='md'>
					{replies.map((reply) => {
						const isAuthor = currentUserId === reply.user.id;
						const showActions = hoveredReplyId === reply.id;

						return (
							<Group
								key={reply.id}
								align='flex-start'
								gap='sm'
								wrap='nowrap'
								onMouseEnter={() => setHoveredReplyId(reply.id)}
								onMouseLeave={() => setHoveredReplyId(null)}
							>
								<Avatar
									src={reply.user.image}
									alt={reply.user.name || 'User'}
									radius='xl'
									size='sm'
									color='blue'
								>
									{reply.user.name?.[0]?.toUpperCase()}
								</Avatar>

								<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
									<Group gap='xs' wrap='nowrap'>
										<Text size='xs' fw={600}>
											{reply.user.name || 'Unknown User'}
										</Text>
										<Text size='xs' c='dimmed'>
											{formatTimeAgo(reply.createdAt)}
										</Text>
										{isAuthor && showActions && (
											<Group gap={2} ml='auto'>
												<Tooltip label='Delete'>
													<ActionIcon
														variant='subtle'
														color='red'
														size='xs'
														onClick={() => deleteReplyMutation.mutate(reply.id)}
														loading={deleteReplyMutation.isPending}
													>
														<IconTrash size={12} />
													</ActionIcon>
												</Tooltip>
											</Group>
										)}
									</Group>
									<Text
										size='sm'
										style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
									>
										{reply.content}
									</Text>
								</Stack>
							</Group>
						);
					})}

					<Group align='flex-start' gap='sm' wrap='nowrap' mt='xs'>
						<Avatar radius='xl' size='sm' color='blue' />
						<Stack gap='xs' style={{ flex: 1 }}>
							<Textarea
								placeholder='Write a reply...'
								value={replyText}
								onChange={(e) => setReplyText(e.target.value)}
								minRows={2}
								maxRows={6}
								autosize
								styles={{
									input: {
										fontSize: 'var(--mantine-font-size-sm)',
									},
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
										e.preventDefault();
										handleSubmit();
									}
								}}
							/>
							<Group justify='flex-end'>
								<Button
									size='xs'
									rightSection={<IconSend size={14} />}
									onClick={handleSubmit}
									disabled={!replyText.trim()}
									loading={createReplyMutation.isPending}
								>
									Reply
								</Button>
							</Group>
						</Stack>
					</Group>
				</Stack>
			</Box>
		</Stack>
	);
}
