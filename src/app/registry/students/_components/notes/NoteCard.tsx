'use client';

import {
	ActionIcon,
	Anchor,
	Badge,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	TypographyStylesProvider,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
	IconEdit,
	IconFile,
	IconLock,
	IconTrash,
	IconUsers,
	IconWorld,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { NoteVisibility } from '@/app/registry/student-notes/_schema/studentNotes';
import { deleteStudentNote } from '@/app/registry/student-notes/_server/actions';
import type { StudentNoteRecord } from '@/app/registry/student-notes/_server/repository';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
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

export default function NoteCard({
	note,
	stdNo,
	currentUserId,
	currentUserRole,
}: Props) {
	const [editOpen, setEditOpen] = useState(false);
	const queryClient = useQueryClient();

	const canManage =
		currentUserRole === 'admin' || note.createdBy === currentUserId;

	const deleteMutation = useMutation({
		mutationFn: () => deleteStudentNote(note.id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['student-notes', stdNo],
			});
			notifications.show({
				title: 'Success',
				message: 'Note deleted',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleDelete() {
		modals.openConfirmModal({
			centered: true,
			title: 'Delete Note',
			children: (
				<Text size='sm'>Are you sure you want to delete this note?</Text>
			),
			confirmProps: { color: 'red' },
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			onConfirm: () => deleteMutation.mutate(),
		});
	}

	const vis = VISIBILITY_CONFIG[note.visibility];
	const VisIcon = vis.icon;

	return (
		<>
			<Paper p='md' withBorder>
				<Stack gap='sm'>
					<Group justify='space-between' align='flex-start'>
						<Group gap='xs'>
							<Text fw={600} size='sm'>
								{note.createdByUser?.name ?? 'Unknown'}
							</Text>
							<Badge variant='light' size='sm'>
								{note.creatorRole}
							</Badge>
							<Text size='xs' c='dimmed'>
								{formatRelativeTime(note.createdAt)}
							</Text>
							<Badge
								variant='light'
								size='xs'
								color={vis.color}
								leftSection={<VisIcon size={12} />}
							>
								{vis.label}
							</Badge>
						</Group>
						{canManage && (
							<Group gap={4}>
								<ActionIcon
									variant='subtle'
									size='sm'
									onClick={() => setEditOpen(true)}
								>
									<IconEdit size={14} />
								</ActionIcon>
								<ActionIcon
									variant='subtle'
									size='sm'
									color='red'
									onClick={handleDelete}
									loading={deleteMutation.isPending}
								>
									<IconTrash size={14} />
								</ActionIcon>
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
