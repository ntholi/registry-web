'use client';

import { Button, Modal, Stack, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createAnnouncement } from '../server/actions';

type Props = {
	courseId: string;
};

export default function CreateAnnouncementButton({ courseId }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [text, setText] = useState('');
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	async function handleSubmit() {
		if (!text.trim()) {
			notifications.show({
				title: 'Error',
				message: 'Please enter your post content',
				color: 'red',
			});
			return;
		}

		setLoading(true);
		try {
			const result = await createAnnouncement({
				courseId,
				text: text.trim(),
			});

			if (result.success) {
				notifications.show({
					title: 'Success',
					message: 'Post created successfully',
					color: 'green',
				});
				setText('');
				close();
				await queryClient.invalidateQueries({
					queryKey: ['course-announcements', courseId],
				});
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to create post',
					color: 'red',
				});
			}
		} catch (_error) {
			notifications.show({
				title: 'Error',
				message: 'Failed to create post',
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<Button size='xs' leftSection={<IconPlus size={14} />} onClick={open}>
				New Post
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Create New Post'
				centered
				size='md'
			>
				<Stack gap='md'>
					<Textarea
						placeholder='Share something with your class...'
						value={text}
						onChange={(e) => setText(e.currentTarget.value)}
						minRows={5}
						autosize
						maxRows={12}
					/>
					<Button onClick={handleSubmit} loading={loading} fullWidth>
						Publish Post
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
