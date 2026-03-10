'use client';

import {
	ActionIcon,
	Anchor,
	Avatar,
	Badge,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	TypographyStylesProvider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconEdit,
	IconFile,
	IconLock,
	IconUsers,
	IconWorld,
} from '@tabler/icons-react';
import { useState } from 'react';
import type { NoteVisibility } from '@/app/registry/student-notes/_schema/studentNotes';
import { deleteStudentNote } from '@/app/registry/student-notes/_server/actions';
import type { StudentNoteRecord } from '@/app/registry/student-notes/_server/repository';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { DeleteButton } from '@/shared/ui/adease';
import NoteModal from './NoteModal';

type Props = {
	note: StudentNoteRecord;
	stdNo: number;
	currentUserId: string;
	currentUserRole: string;
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

export default function NoteCard({
	note,
	stdNo,
	currentUserId,
	currentUserRole,
}: Props) {
	const [editOpen, setEditOpen] = useState(false);

	const canManage =
		currentUserRole === 'admin' || note.createdBy === currentUserId;

	const vis = VISIBILITY_CONFIG[note.visibility];
	const VisIcon = vis.icon;
	const authorName = note.createdByUser?.name ?? 'Unknown';

	return (
		<>
			<Paper p='md' withBorder>
				<Stack gap='sm'>
					<Group justify='space-between' align='flex-start' wrap='nowrap'>
						<Group gap='xs' wrap='nowrap' align='flex-start'>
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
									<VisIcon
										size={11}
										style={{ color: 'var(--mantine-color-dimmed)' }}
									/>
								</Group>
							</Stack>
						</Group>
						{canManage && (
							<Group gap={4} wrap='nowrap'>
								<ActionIcon
									variant='subtle'
									size='sm'
									onClick={() => setEditOpen(true)}
								>
									<IconEdit size={14} />
								</ActionIcon>
								<DeleteButton
									size='sm'
									handleDelete={() => deleteStudentNote(note.id)}
									queryKey={['student-notes', stdNo]}
									itemType='note'
									onSuccess={() =>
										notifications.show({
											title: 'Success',
											message: 'Note deleted',
											color: 'green',
										})
									}
								/>
							</Group>
						)}
					</Group>

					<TypographyStylesProvider>
						<div dangerouslySetInnerHTML={{ __html: note.content }} />
					</TypographyStylesProvider>

					{note.attachments.length > 0 && (
						<>
							<Divider />
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
						</>
					)}
				</Stack>
			</Paper>

			{editOpen && (
				<NoteModal
					opened={editOpen}
					onClose={() => setEditOpen(false)}
					stdNo={stdNo}
					note={note}
				/>
			)}
		</>
	);
}
