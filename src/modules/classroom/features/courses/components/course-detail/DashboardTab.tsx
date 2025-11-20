'use client';

import {
	Avatar,
	Box,
	Card,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	TypographyStylesProvider,
} from '@mantine/core';
import {
	IconBrandYoutube,
	IconFileText,
	IconForms,
	IconLink,
	IconSpeakerphone,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { Announcement } from '../../server/actions';
import { getCourseAnnouncements } from '../../server/actions';

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
					<ThemeIcon size={48} radius='xl' variant='light' color='gray'>
						<IconSpeakerphone size={24} />
					</ThemeIcon>
					<Text c='dimmed' ta='center'>
						No announcements yet
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='lg'>
			{announcements.map((announcement) => {
				const attachments = (announcement.materials || []).map(
					(material, index) => resolveAttachment(material, index)
				);

				return (
					<Paper
						key={announcement.id}
						p='lg'
						radius='md'
						withBorder
						shadow='xs'
					>
						<Stack gap='md'>
							<Group justify='space-between' align='flex-start'>
								<Group gap='sm'>
									<Avatar radius='xl' color='blue'>
										<IconSpeakerphone size='1.2rem' />
									</Avatar>
									<div>
										<Text size='sm' fw={600}>
											Announcement
										</Text>
										<Text size='xs' c='dimmed'>
											{formatDate(announcement.creationTime)}
										</Text>
									</div>
								</Group>
							</Group>

							{announcement.text && (
								<TypographyStylesProvider p={0} fz='sm'>
									<div
										dangerouslySetInnerHTML={{ __html: announcement.text }}
										style={{ fontSize: 'var(--mantine-font-size-sm)' }}
									/>
								</TypographyStylesProvider>
							)}

							{attachments.length > 0 && (
								<Stack gap='xs' mt='xs'>
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
													transition: 'background-color 0.2s',
												}}
											>
												<Group gap='sm' wrap='nowrap'>
													<ThemeIcon
														size='md'
														radius='sm'
														variant='white'
														color='gray'
													>
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
						</Stack>
					</Paper>
				);
			})}
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
