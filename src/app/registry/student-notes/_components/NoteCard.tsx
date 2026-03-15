'use client';

import {
	ActionIcon,
	Anchor,
	Avatar,
	Badge,
	Button,
	Divider,
	Group,
	Menu,
	Modal,
	Paper,
	Stack,
	Text,
	TypographyStylesProvider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconDotsVertical,
	IconEdit,
	IconFile,
	IconTrash,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { useActionMutation } from '@/shared/lib/hooks/use-action-mutation';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { getInitials, VISIBILITY_CONFIG } from '../_lib/constants';
import { deleteStudentNote } from '../_server/actions';
import type { StudentNoteRecord } from '../_server/repository';
import NoteModal from './NoteModal';

type Props = {
	note: StudentNoteRecord;
	stdNo: number;
	currentUserId: string;
	currentUserRole: string;
};

export default function NoteCard({
	note,
	stdNo,
	currentUserId,
	currentUserRole,
}: Props) {
	const [editOpen, setEditOpen] = useState(false);
	const [delOpen, { open: openDel, close: closeDel }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const deleteMutation = useActionMutation(() => deleteStudentNote(note.id), {
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['student-notes', stdNo],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Success',
				message: 'Note deleted',
				color: 'green',
			});
			closeDel();
		},
	});

	const vis = VISIBILITY_CONFIG[note.visibility];
	const VisIcon = vis.icon;
	const authorName = note.createdByUser?.name ?? 'Unknown';
	const canManage =
		currentUserRole === 'admin' || note.createdBy === currentUserId;

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
							<Menu shadow='md' position='bottom-end' withArrow>
								<Menu.Target>
									<ActionIcon variant='subtle' size='sm' color='gray'>
										<IconDotsVertical size={16} />
									</ActionIcon>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Item
										leftSection={<IconEdit size={14} />}
										onClick={() => setEditOpen(true)}
									>
										Edit
									</Menu.Item>
									<Menu.Item
										leftSection={<IconTrash size={14} />}
										color='red'
										onClick={openDel}
									>
										Delete
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
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

			<Modal
				opened={delOpen}
				onClose={closeDel}
				title='Delete note'
				size='sm'
				centered
			>
				<Text size='sm' c='dimmed'>
					Are you sure you want to delete this note? This action cannot be
					undone.
				</Text>
				<Group justify='flex-end' mt='lg' gap='sm'>
					<Button variant='default' onClick={closeDel}>
						Cancel
					</Button>
					<Button
						color='red'
						leftSection={<IconTrash size={14} />}
						loading={deleteMutation.isPending}
						onClick={() => deleteMutation.mutate()}
					>
						Delete
					</Button>
				</Group>
			</Modal>
		</>
	);
}
