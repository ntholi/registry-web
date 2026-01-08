'use client';

import {
	Box,
	Button,
	Group,
	Paper,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { useState } from 'react';
import { formatDateTime } from '@/shared/lib/utils/dates';

type Props = {
	assignmentId: number;
	userId: number;
};

type Comment = {
	id: number;
	text: string;
	createdAt: Date;
	author: string;
};

export default function CommentsView({
	assignmentId: _assignmentId,
	userId: _userId,
}: Props) {
	const [comment, setComment] = useState('');
	const [comments] = useState<Comment[]>([]);

	const handleSubmit = () => {
		if (!comment.trim()) return;
		setComment('');
	};

	return (
		<Stack gap='md'>
			<Box>
				<Text fw={600} size='md' mb='sm'>
					Feedback Comments
				</Text>
				<Text size='sm' c='dimmed' mb='md'>
					Add comments or feedback for the student. These will be visible to the
					student once published.
				</Text>
			</Box>

			<Textarea
				placeholder='Write your feedback here...'
				value={comment}
				onChange={(e) => setComment(e.currentTarget.value)}
				minRows={4}
				autosize
			/>

			<Group justify='flex-end'>
				<Button onClick={handleSubmit} disabled={!comment.trim()}>
					Submit Comment
				</Button>
			</Group>

			{comments.length > 0 && (
				<Stack gap='sm' mt='md'>
					<Text fw={600} size='sm'>
						Previous Comments
					</Text>
					{comments.map((c) => (
						<Paper key={c.id} p='md' withBorder>
							<Text size='sm'>{c.text}</Text>
							<Text size='xs' c='dimmed' mt='xs'>
								{c.author} • {formatDateTime(c.createdAt)}
							</Text>
						</Paper>
					))}
				</Stack>
			)}
		</Stack>
	);
}
