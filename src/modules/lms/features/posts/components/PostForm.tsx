'use client';

import {
	Button,
	Modal,
	SegmentedControl,
	Stack,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import RichTextField from '@/shared/ui/adease/RichTextField';
import { createPost } from '../server/actions';
import type { PostType } from '../types';

const schema = z.object({
	postType: z.enum(['announcement', 'discussion']),
	subject: z.string().min(1, 'Subject is required'),
	message: z.string().min(1, 'Message is required'),
});

type FormValues = z.infer<typeof schema>;

type PostFormProps = {
	courseId: number;
};

export default function PostForm({ courseId }: PostFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			postType: 'announcement' as PostType,
			subject: '',
			message: '',
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			return createPost({
				courseId,
				postType: values.postType as PostType,
				subject: values.subject,
				message: values.message,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Post created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['course-posts', courseId],
			});
			form.reset();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create post',
				color: 'red',
			});
		},
	});

	const handleSubmit = form.onSubmit((values) => {
		mutation.mutate(values);
	});

	return (
		<>
			<Button
				onClick={open}
				variant='light'
				leftSection={<IconPlus size={16} />}
				size='xs'
			>
				New Post
			</Button>

			<Modal opened={opened} onClose={close} title='Create Post' size='lg'>
				<form onSubmit={handleSubmit}>
					<Stack>
						<SegmentedControl
							data={[
								{ label: 'Announcement', value: 'announcement' },
								{ label: 'Discussion', value: 'discussion' },
							]}
							{...form.getInputProps('postType')}
						/>

						<TextInput
							label='Subject'
							placeholder='Enter post subject'
							required
							{...form.getInputProps('subject')}
						/>

						<RichTextField
							label='Message'
							height={300}
							{...form.getInputProps('message')}
						/>

						<Button type='submit' loading={mutation.isPending}>
							{form.getInputProps('postType').value === 'announcement'
								? 'Create Announcement'
								: 'Create Discussion'}
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
