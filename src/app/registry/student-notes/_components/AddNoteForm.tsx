'use client';

import { Button, Group, Paper, SegmentedControl, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import RichTextField from '@/shared/ui/adease/RichTextField';
import { VISIBILITY_OPTIONS } from '../_lib/constants';
import type { NoteVisibility } from '../_schema/studentNotes';
import { createStudentNote } from '../_server/actions';

type Props = {
	stdNo: number;
};

export default function AddNoteForm({ stdNo }: Props) {
	const [content, setContent] = useState('');
	const [visibility, setVisibility] = useState<NoteVisibility>('role');
	const queryClient = useQueryClient();

	const mutation = useActionMutation(
		() => createStudentNote(stdNo, content, visibility),
		{
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: ['student-notes', stdNo],
				});
				setContent('');
				notifications.show({
					title: 'Success',
					message: 'Note added',
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
		}
	);

	const isEmpty = !content.trim() || content === '<p></p>';

	return (
		<Paper p='md' withBorder>
			<Stack gap='sm'>
				<RichTextField
					toolbar='normal'
					placeholder='Write a note...'
					value={content}
					onChange={setContent}
					height={150}
					showFullScreenButton={false}
				/>
				<Group justify='space-between'>
					<SegmentedControl
						size='xs'
						data={VISIBILITY_OPTIONS}
						value={visibility}
						onChange={(val) => setVisibility(val as NoteVisibility)}
					/>
					<Button
						leftSection={<IconSend size={16} />}
						onClick={() => mutation.mutate()}
						loading={mutation.isPending}
						disabled={isEmpty}
					>
						Add Note
					</Button>
				</Group>
			</Stack>
		</Paper>
	);
}
