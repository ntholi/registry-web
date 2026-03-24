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
} from '@mantine/core';
import { IconFile } from '@tabler/icons-react';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { RichTextContent } from '@/shared/ui/adease';
import { getInitials, VISIBILITY_CONFIG } from '../_lib/constants';
import type { StudentNoteRecord } from '../_server/repository';

type Props = {
	note: StudentNoteRecord;
};

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

					<RichTextContent html={note.content} />

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
