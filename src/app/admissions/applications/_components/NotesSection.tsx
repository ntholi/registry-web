'use client';

import { Button, Group, Paper, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { addApplicationNote } from '../_server/actions';

type NoteEntry = {
	id: number;
	content: string;
	createdBy: string | null;
	createdByUser: { id: string; name: string | null } | null;
	createdAt: Date | null;
};

type Props = {
	applicationId: number;
	notes: NoteEntry[];
};

export default function NotesSection({ applicationId, notes }: Props) {
	const [content, setContent] = useState('');
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async () => {
			if (!content.trim()) throw new Error('Note content is required');
			return addApplicationNote(applicationId, content.trim());
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applications'] });
			setContent('');
			notifications.show({
				title: 'Success',
				message: 'Note added successfully',
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

	return (
		<Stack gap='md'>
			<Group align='flex-end'>
				<Textarea
					placeholder='Add a note...'
					value={content}
					onChange={(e) => setContent(e.target.value)}
					style={{ flex: 1 }}
					minRows={2}
				/>
				<Button
					leftSection={<IconSend size={16} />}
					onClick={() => mutation.mutate()}
					loading={mutation.isPending}
					disabled={!content.trim()}
				>
					Add Note
				</Button>
			</Group>

			{notes.length === 0 ? (
				<Text size='sm' c='dimmed'>
					No notes yet
				</Text>
			) : (
				<Stack gap='sm'>
					{notes.map((note) => (
						<Paper key={note.id} p='sm' withBorder>
							<Stack gap={4}>
								<Text size='sm'>{note.content}</Text>
								<Text size='xs' c='dimmed'>
									{note.createdByUser?.name || 'Unknown'} •{' '}
									{note.createdAt ? formatDateTime(note.createdAt) : ''}
								</Text>
							</Stack>
						</Paper>
					))}
				</Stack>
			)}
		</Stack>
	);
}
