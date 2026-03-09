'use client';

import {
	ActionIcon,
	Badge,
	Button,
	Divider,
	Group,
	Paper,
	SegmentedControl,
	Stack,
	Text,
	TypographyStylesProvider,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
	IconEdit,
	IconLock,
	IconTrash,
	IconUsers,
	IconWorld,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { NoteVisibility } from '@/app/registry/student-notes/_schema/studentNotes';
import {
	deleteStudentNote,
	updateStudentNote,
} from '@/app/registry/student-notes/_server/actions';
import type { StudentNoteRecord } from '@/app/registry/student-notes/_server/repository';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import RichTextField from '@/shared/ui/adease/RichTextField';
import AttachmentList from './AttachmentList';

type Props = {
	note: StudentNoteRecord;
	stdNo: number;
	currentUserId: string;
	currentUserRole: string;
};

const VISIBILITY_OPTIONS = [
	{ label: 'My Department', value: 'role' },
	{ label: 'Only Me', value: 'self' },
	{ label: 'Everyone', value: 'everyone' },
];

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
	const [editing, setEditing] = useState(false);
	const [editContent, setEditContent] = useState(note.content);
	const [editVisibility, setEditVisibility] = useState<NoteVisibility>(
		note.visibility
	);
	const queryClient = useQueryClient();

	const canManage =
		currentUserRole === 'admin' || note.createdBy === currentUserId;

	const updateMutation = useMutation({
		mutationFn: () => updateStudentNote(note.id, editContent, editVisibility),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['student-notes', stdNo],
			});
			setEditing(false);
			notifications.show({
				title: 'Success',
				message: 'Note updated',
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

	function handleStartEdit() {
		setEditContent(note.content);
		setEditVisibility(note.visibility);
		setEditing(true);
	}

	const vis = VISIBILITY_CONFIG[note.visibility];
	const VisIcon = vis.icon;

	return (
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
					{canManage && !editing && (
						<Group gap={4}>
							<ActionIcon variant='subtle' size='sm' onClick={handleStartEdit}>
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

				{editing ? (
					<Stack gap='sm'>
						<RichTextField
							toolbar='normal'
							value={editContent}
							onChange={setEditContent}
							height={150}
							showFullScreenButton={false}
						/>
						<Group justify='space-between'>
							<SegmentedControl
								size='xs'
								data={VISIBILITY_OPTIONS}
								value={editVisibility}
								onChange={(val) => setEditVisibility(val as NoteVisibility)}
							/>
							<Group gap='xs'>
								<Button
									variant='default'
									size='xs'
									onClick={() => setEditing(false)}
								>
									Cancel
								</Button>
								<Button
									size='xs'
									onClick={() => updateMutation.mutate()}
									loading={updateMutation.isPending}
								>
									Save
								</Button>
							</Group>
						</Group>
					</Stack>
				) : (
					<TypographyStylesProvider>
						<div dangerouslySetInnerHTML={{ __html: note.content }} />
					</TypographyStylesProvider>
				)}

				{note.attachments.length > 0 && (
					<>
						<Divider />
						<AttachmentList
							noteId={note.id}
							stdNo={stdNo}
							attachments={note.attachments}
							canEdit={canManage}
						/>
					</>
				)}
				{note.attachments.length === 0 && canManage && (
					<AttachmentList
						noteId={note.id}
						stdNo={stdNo}
						attachments={[]}
						canEdit
					/>
				)}
			</Stack>
		</Paper>
	);
}
