import { Card, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import {
	IconFile,
	IconLink,
	IconListCheck,
	IconPlayerPlay,
} from '@tabler/icons-react';
import type { Announcement } from '../../server/actions';

type Props = {
	announcements: Announcement[];
};

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function DashboardTab({ announcements }: Props) {
	if (announcements.length === 0) {
		return (
			<Paper p='xl' radius='lg' withBorder>
				<Text c='dimmed' ta='center'>
					No announcements yet
				</Text>
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
					<Paper key={announcement.id} p='xl' radius='lg' withBorder>
						<Stack gap='lg'>
							<Group justify='space-between' align='flex-start'>
								<Text size='sm' c='dimmed'>
									{formatDate(announcement.creationTime)}
								</Text>
							</Group>

							{announcement.text && (
								<Text
									size='sm'
									c='dimmed'
									style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
									dangerouslySetInnerHTML={{ __html: announcement.text }}
								/>
							)}

							{attachments.length > 0 && (
								<Stack gap='sm'>
									<Text size='xs' fw={600} tt='uppercase' c='dimmed'>
										Attachments
									</Text>
									<Stack gap='xs'>
										{attachments.map((attachment) => {
											const Icon = getAttachmentIcon(attachment.type);
											const content = (
												<Group gap='sm' align='flex-start'>
													<ThemeIcon size='lg' radius='md' variant='light'>
														<Icon size='1.1rem' />
													</ThemeIcon>
													<Stack gap='2px' style={{ flex: 1, minWidth: 0 }}>
														<Text size='sm' fw={500} truncate>
															{attachment.title}
														</Text>
														<Text size='xs' c='dimmed'>
															{attachment.label}
														</Text>
													</Stack>
												</Group>
											);

											if (attachment.url) {
												return (
													<Card
														key={attachment.key}
														component='a'
														href={attachment.url}
														target='_blank'
														rel='noreferrer'
														withBorder
														radius='md'
														p='md'
													>
														{content}
													</Card>
												);
											}

											return (
												<Card
													key={attachment.key}
													withBorder
													radius='md'
													p='md'
												>
													{content}
												</Card>
											);
										})}
									</Stack>
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
			return IconPlayerPlay;
		case 'form':
			return IconListCheck;
		default:
			return IconFile;
	}
}
