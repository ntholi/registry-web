'use client';

import { Button, Modal, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { createAnnouncement } from '../server/actions';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

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
				message: 'Please enter announcement text',
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
					message: 'Announcement created successfully',
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
					message: result.error || 'Failed to create announcement',
					color: 'red',
				});
			}
		} catch (error) {
			notifications.show({
				title: 'Error',
				message: 'Failed to create announcement',
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<Button size='xs' leftSection={<IconPlus size={14} />} onClick={open}>
				Create Announcement
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Create Announcement'
				centered
			>
				<Textarea
					label='Announcement'
					placeholder='Enter announcement text...'
					value={text}
					onChange={(e) => setText(e.currentTarget.value)}
					minRows={4}
					required
				/>
				<Button
					onClick={handleSubmit}
					loading={loading}
					fullWidth
					mt='md'
				>
					Create
				</Button>
			</Modal>
		</>
	);
}
