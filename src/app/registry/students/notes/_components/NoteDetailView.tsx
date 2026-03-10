'use client';

import {
	Anchor,
	Avatar,
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	TypographyStylesProvider,
} from '@mantine/core';
import { IconFile, IconLock, IconUsers, IconWorld } from '@tabler/icons-react';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import type { NoteVisibility } from '../_schema/studentNotes';
import type { StudentNoteRecord } from '../_server/repository';

type Props = {
	note: StudentNoteRecord;
};

const VISIBILITY_CONFIG: Record<
	NoteVisibility,
	{ icon: typeof IconUsers; color: string; label: string }
> = {
	role: { icon: IconUsers, color: 'blue', label: 'Department' },
	self: { icon: IconLock, color: 'red', label: 'Only Me' },
	everyone: { icon: IconWorld, color: 'green', label: 'Everyone' },
};

function getInitials(name: string | null): string {
	if (!name) return '?';
	return name
		.split(' ')
		.slice(0, 2)
		.map((n) => n[0])
		.join('')
		.toUpperCase();
}

export default function NoteDetailView({ note }: Props) {
	const vis = VISIBILITY_CONFIG[note.visibility];
	const VisIcon = vis.icon;
	const authorName = note.createdByUser?.name ?? 'Unknown';

	return (
		<Stack gap='md' p='md'>
			<Paper withBorder p='md'>
				<Stack gap='sm'>
					<Group justify='space-between' align='flex-start'>
						<Group gap='xs' align='flex-start'>
							<Avatar size={38} radius='xl' color='initials' name={authorName}>
								{getInitials(authorName)}
							</Avatar>
							<Stack gap={2}>
								<Group gap='xs' align='center'>
									<Text fw={700} size='sm' lh={1.2}>
										{authorName}
									</Text>
									<Badge variant='light' size='xs' radius='sm'>
										{note.creatorRole}
									</Badge>
								</Group>
								<Group gap={4} align='center'>
									<Text size='xs' c='dimmed' lh={1}>
										{formatRelativeTime(note.createdAt)}
									</Text>
									<Text size='xs' c='dimmed' lh={1}>
										·
									</Text>
									<Group gap={2} align='center'>
										<VisIcon
											size={11}
											style={{ color: `var(--mantine-color-${vis.color}-6)` }}
										/>
										<Text size='xs' c={vis.color}>
											{vis.label}
										</Text>
									</Group>
								</Group>
							</Stack>
						</Group>
						<Badge variant='outline' size='sm'>
							{note.stdNo}
						</Badge>
					</Group>

					<Divider />

					<TypographyStylesProvider>
						<div dangerouslySetInnerHTML={{ __html: note.content }} />
					</TypographyStylesProvider>

					{note.attachments.length > 0 && (
						<>
							<Divider />
							<Box>
								<Text size='sm' fw={500} mb='xs'>
									Attachments
								</Text>
								<Stack gap={4}>
									{note.attachments.map((a) => (
										<Group key={a.id} gap='xs'>
											<IconFile
												size={14}
												style={{ color: 'var(--mantine-color-dimmed)' }}
											/>
											<Anchor
												href={getPublicUrl(a.fileKey)}
												target='_blank'
												size='xs'
											>
												{a.fileName}
											</Anchor>
										</Group>
									))}
								</Stack>
							</Box>
						</>
					)}
				</Stack>
			</Paper>
		</Stack>
	);
}
