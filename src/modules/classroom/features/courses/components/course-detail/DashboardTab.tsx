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
	Skeleton,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
	TypographyStylesProvider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconBrandYoutube,
	IconFileText,
	IconForms,
	IconLink,
	IconMessage,
	IconSend,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Announcement } from '../../server/actions';
import {
	createPostReply,
	getCourseAnnouncements,
} from '../../server/actions';

type Props = {
	courseId: string;
};

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function DashboardSkeleton() {
	return (
		<Stack gap='lg'>
			{[0, 1, 2].map((i) => (
				<Skeleton key={i} height={150} radius='lg' />
			))}
		</Stack>
	);
}

type AnnouncementWithCreator = Announcement & {
	creator?: {
		id?: string | null;
		name?: { givenName?: string | null; familyName?: string | null; fullName?: string | null } | null;
		emailAddress?: string | null;
		photoUrl?: string | null;
	};
};

function ForumPost({ post, courseId }: { post: AnnouncementWithCreator; courseId: string }) {
	const [opened, { toggle }] = useDisclosure(false);
	const [replyText, setReplyText] = useState('');
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	const attachments = (post.materials || []).map((material, index) =>
		resolveAttachment(material, index)
	);

	async function handleReply() {
		if (!replyText.trim()) {
			notifications.show({
				title: 'Error',
				message: 'Please enter a reply',
				color: 'red',
			});
			return;
		}

		setLoading(true);
		try {
			const result = await createPostReply({
				courseId,
				text: replyText.trim(),
				parentPostId: post.id || undefined,
			});

			if (result.success) {
				notifications.show({
					title: 'Success',
					message: 'Reply posted successfully',
					color: 'green',
				});
				setReplyText('');
				toggle();
				await queryClient.invalidateQueries({
					queryKey: ['course-announcements', courseId],
				});
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to post reply',
					color: 'red',
				});
			}
		} catch (_error) {
			notifications.show({
				title: 'Error',
				message: 'Failed to post reply',
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	const authorName =
		post.creator?.name?.fullName ||
		`${post.creator?.name?.givenName || ''} ${post.creator?.name?.familyName || ''}`.trim() ||
		post.creator?.emailAddress ||
		'Unknown User';

	const avatarSrc = post.creator?.photoUrl || undefined;

	return (
		<Paper
			p='lg'
			radius='md'
			withBorder
			shadow='sm'
			style={{
				transition: 'box-shadow 0.2s',
			}}
		>
			<Stack gap='md'>
				<Group gap='md' wrap='nowrap'>
					<Avatar src={avatarSrc} radius='xl' size='lg' color='blue'>
						{!avatarSrc && authorName.charAt(0).toUpperCase()}
					</Avatar>
					<div style={{ flex: 1 }}>
						<Text size='sm' fw={600}>
							{authorName}
						</Text>
						<Text size='xs' c='dimmed'>
							{formatDate(post.creationTime)}
						</Text>
					</div>
				</Group>

				{post.text && (
					<TypographyStylesProvider p={0}>
						<div
							dangerouslySetInnerHTML={{ __html: post.text }}
							style={{
								fontSize: 'var(--mantine-font-size-sm)',
								lineHeight: 1.6,
							}}
						/>
					</TypographyStylesProvider>
				)}

				{attachments.length > 0 && (
					<Stack gap='xs'>
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
									p='sm'
									bg='gray.0'
									style={{
										cursor: attachment.url ? 'pointer' : 'default',
										transition: 'background-color 0.2s, transform 0.2s',
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

				<Divider />

				<Group gap='xs'>
					<ActionIcon
						variant='subtle'
						color='gray'
						size='md'
						onClick={toggle}
						title='Reply to this post'
					>
						<IconMessage size='1rem' />
					</ActionIcon>
					<Text size='xs' c='dimmed' onClick={toggle} style={{ cursor: 'pointer' }}>
						Reply
					</Text>
				</Group>

				<Collapse in={opened}>
					<Stack gap='sm' pt='xs'>
						<Textarea
							placeholder='Write a reply...'
							value={replyText}
							onChange={(e) => setReplyText(e.currentTarget.value)}
							minRows={2}
							autosize
						/>
						<Group justify='flex-end'>
							<Button
								size='xs'
								variant='subtle'
								color='gray'
								onClick={toggle}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button
								size='xs'
								leftSection={<IconSend size={14} />}
								onClick={handleReply}
								loading={loading}
							>
								Post Reply
							</Button>
						</Group>
					</Stack>
				</Collapse>
			</Stack>
		</Paper>
	);
}

export default function DashboardTab({ courseId }: Props) {
	const { data: announcements, isLoading } = useQuery({
		queryKey: ['course-announcements', courseId],
		queryFn: () => getCourseAnnouncements(courseId),
	});

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	if (!announcements || announcements.length === 0) {
		return (
			<Paper p='xl' radius='md' withBorder>
				<Stack align='center' gap='md'>
					<ThemeIcon size={60} radius='xl' variant='light' color='gray'>
						<IconMessage size={30} />
					</ThemeIcon>
					<div>
						<Text size='lg' fw={600} ta='center'>
							No posts yet
						</Text>
						<Text size='sm' c='dimmed' ta='center' mt={4}>
							Start a discussion by creating a new post
						</Text>
					</div>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			{announcements.map((announcement) => (
				<ForumPost
					key={announcement.id}
					post={announcement as AnnouncementWithCreator}
					courseId={courseId}
				/>
			))}
		</Stack>
	);
}

type AttachmentType = 'file' | 'link' | 'video' | 'form';

type AnnouncementMaterial = NonNullable<Announcement['materials']>[number];

type ResolvedAttachment = {
	key: string;
	title: string;
	url?: string;
	label: string;
	type: AttachmentType;
};

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
