'use client';

import {
	ActionIcon,
	Avatar,
	Box,
	Button,
	Card,
	Collapse,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
	TypographyStylesProvider,
} from '@mantine/core';
import {
	IconBrandYoutube,
	IconFileText,
	IconForms,
	IconLink,
	IconMessage,
	IconSend,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import type { Announcement } from '../../server/actions';
import {
	createReply,
	getRepliesByAnnouncementId,
} from '@/modules/classroom/features/announcement-replies';

type Props = {
	post: Announcement;
	courseId: string;
};

type AttachmentType = 'file' | 'link' | 'video' | 'form';

type AnnouncementMaterial = NonNullable<Announcement['materials']>[number];

type ResolvedAttachment = {
	key: string;
	title: string;
	url?: string;
	label: string;
	type: AttachmentType;
};

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return '';
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;

	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
	});
}

function resolveAttachment(
	material: AnnouncementMaterial,
	index: number
): ResolvedAttachment {
	const key =
		material.driveFile?.driveFile?.id ||
		material.link?.url ||
		material.youtubeVideo?.id ||
		material.form?.formUrl ||
		`${index}`;

	const title =
		material.driveFile?.driveFile?.title ||
		material.link?.title ||
		material.youtubeVideo?.title ||
		material.form?.title ||
		'Attachment';

	const url =
		material.link?.url ||
		material.driveFile?.driveFile?.alternateLink ||
		material.youtubeVideo?.alternateLink ||
		material.form?.formUrl ||
		undefined;

	if (material.link) {
		return {
			key,
			title,
			url,
			label: material.link.title ? 'Link' : 'External resource',
			type: 'link',
		};
	}

	if (material.youtubeVideo) {
		return {
			key,
			title,
			url,
			label: 'Video',
			type: 'video',
		};
	}

	if (material.form) {
		return {
			key,
			title,
			url,
			label: 'Form',
			type: 'form',
		};
	}

	return {
		key,
		title,
		url,
		label: 'Drive file',
		type: 'file',
	};
}

function getAttachmentIcon(type: AttachmentType) {
	switch (type) {
		case 'link':
			return IconLink;
		case 'video':
			return IconBrandYoutube;
		case 'form':
			return IconForms;
		default:
			return IconFileText;
	}
}

export default function ForumPost({ post, courseId }: Props) {
	const [showReplies, setShowReplies] = useState(false);
	const [replyText, setReplyText] = useState('');
	const queryClient = useQueryClient();

	const { data: replies = [] } = useQuery({
		queryKey: ['announcement-replies', post.id],
		queryFn: () => getRepliesByAnnouncementId(post.id!),
		enabled: showReplies && !!post.id,
	});

	const createReplyMutation = useMutation({
		mutationFn: createReply,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['announcement-replies', post.id],
			});
			setReplyText('');
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

	function handleReplySubmit() {
		if (!replyText.trim() || !post.id) return;

		createReplyMutation.mutate({
			announcementId: post.id,
			courseId,
			text: replyText.trim(),
		});
	}

	const attachments = (post.materials || []).map((material, index) =>
		resolveAttachment(material, index)
	);

	const creatorName = post.creatorUserId || 'Teacher';
	const creatorInitials = creatorName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);

	return (
		<Paper p='lg' radius='md' withBorder shadow='sm'>
			<Stack gap='md'>
				<Group wrap='nowrap' align='flex-start'>
					<Avatar size='lg' radius='xl' color='blue'>
						{creatorInitials}
					</Avatar>
					<Box style={{ flex: 1 }}>
						<Group justify='space-between' wrap='nowrap'>
							<div>
								<Text fw={600} size='sm'>
									{creatorName}
								</Text>
								<Text size='xs' c='dimmed'>
									{formatDate(post.creationTime)}
								</Text>
							</div>
						</Group>

						{post.text && (
							<Box mt='sm'>
								<TypographyStylesProvider>
									<div
										dangerouslySetInnerHTML={{ __html: post.text }}
										style={{
											fontSize: 'var(--mantine-font-size-sm)',
											lineHeight: 1.6,
										}}
									/>
								</TypographyStylesProvider>
							</Box>
						)}

						{attachments.length > 0 && (
							<Stack gap='xs' mt='md'>
								{attachments.map((attachment) => {
									const Icon = getAttachmentIcon(attachment.type);
									return (
										<Card
											key={attachment.key}
											component={attachment.url ? 'a' : 'div'}
											href={attachment.url}
											target='_blank'
											rel='noreferrer'
											withBorder
											radius='sm'
											p='xs'
											bg='gray.0'
											style={{
												cursor: attachment.url ? 'pointer' : 'default',
												transition: 'all 0.2s',
											}}
										>
											<Group gap='sm' wrap='nowrap'>
												<ThemeIcon size='md' radius='sm' variant='light'>
													<Icon size='1rem' />
												</ThemeIcon>
												<Box style={{ flex: 1, minWidth: 0 }}>
													<Text size='sm' fw={500} truncate>
														{attachment.title}
													</Text>
													<Text size='xs' c='dimmed'>
														{attachment.label}
													</Text>
												</Box>
											</Group>
										</Card>
									);
								})}
							</Stack>
						)}
					</Box>
				</Group>

				<Divider />

				<Group gap='md'>
					<Button
						variant='subtle'
						size='xs'
						leftSection={<IconMessage size={16} />}
						onClick={() => setShowReplies(!showReplies)}
					>
						{replies.length > 0 ? `${replies.length} Replies` : 'Reply'}
					</Button>
				</Group>

				<Collapse in={showReplies}>
					<Stack gap='md'>
						{replies.length > 0 && (
							<Stack gap='sm' pl='md'>
								{replies.map((reply) => (
									<Group key={reply.id} wrap='nowrap' align='flex-start'>
										<Avatar size='md' radius='xl' src={reply.user?.image}>
											{reply.user?.name?.[0]?.toUpperCase()}
										</Avatar>
										<Paper p='sm' radius='md' bg='gray.0' style={{ flex: 1 }}>
											<Text size='sm' fw={600}>
												{reply.user?.name || 'Unknown'}
											</Text>
											<Text size='xs' c='dimmed' mb={4}>
												{formatDate(reply.createdAt?.toString())}
											</Text>
											<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
												{reply.text}
											</Text>
										</Paper>
									</Group>
								))}
							</Stack>
						)}

						<Group wrap='nowrap' align='flex-start' pl='md'>
							<Avatar size='md' radius='xl' color='blue'>
								U
							</Avatar>
							<Box style={{ flex: 1 }}>
								<Textarea
									placeholder='Write a reply...'
									value={replyText}
									onChange={(e) => setReplyText(e.currentTarget.value)}
									minRows={2}
									radius='md'
								/>
								<Group justify='flex-end' mt='xs'>
									<Button
										size='xs'
										rightSection={<IconSend size={14} />}
										onClick={handleReplySubmit}
										loading={createReplyMutation.isPending}
										disabled={!replyText.trim()}
									>
										Post Reply
									</Button>
								</Group>
							</Box>
						</Group>
					</Stack>
				</Collapse>
			</Stack>
		</Paper>
	);
}
