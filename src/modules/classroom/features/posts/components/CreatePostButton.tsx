'use client';

import { Button, Modal, Textarea, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createPost } from '../server/actions';

type Props = {
	courseId: string;
};

export default function CreatePostButton({ courseId }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [content, setContent] = useState('');
	const queryClient = useQueryClient();

	const createPostMutation = useMutation({
		mutationFn: (content: string) =>
			createPost({
				courseId,
				content,
			}),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Post created successfully',
				color: 'green',
			});
			setContent('');
			close();
			queryClient.invalidateQueries({
				queryKey: ['course-posts', courseId],
			});
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to create post',
				color: 'red',
			});
		},
	});

	function handleSubmit() {
		if (!content.trim()) {
			notifications.show({
				title: 'Error',
				message: 'Please enter post content',
				color: 'red',
			});
			return;
		}

		createPostMutation.mutate(content.trim());
	}

	return (
		<>
			<Button size='xs' leftSection={<IconPlus size={14} />} onClick={open}>
				Create Post
			</Button>

			<Modal opened={opened} onClose={close} title='Create Post' centered>
				<Stack gap='md'>
					<Textarea
						label='What would you like to share?'
						placeholder='Share your thoughts, questions, or updates...'
						value={content}
						onChange={(e) => setContent(e.currentTarget.value)}
						minRows={5}
						maxRows={15}
						autosize
						required
						onKeyDown={(e) => {
							if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
								e.preventDefault();
								handleSubmit();
							}
						}}
					/>
					<Button
						onClick={handleSubmit}
						loading={createPostMutation.isPending}
						fullWidth
					>
						Post
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
