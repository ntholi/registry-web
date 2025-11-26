'use client';

import { Button, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import RichTextField from '@/shared/ui/adease/RichTextField';
import { createForumDiscussion } from '../server/actions';

const schema = z.object({
	subject: z.string().min(1, 'Subject is required'),
	message: z.string().min(1, 'Message is required'),
});

type FormValues = z.infer<typeof schema>;

type ForumPostFormProps = {
	forumId: number;
};

export default function ForumPostForm({ forumId }: ForumPostFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			subject: '',
			message: '',
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			return createForumDiscussion({
				forumid: forumId,
				subject: values.subject,
				message: values.message,
				messageformat: 1,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Post created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['forum-discussions', forumId],
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
			<Button onClick={open} leftSection={<IconPlus size={16} />}>
				Post
			</Button>

			<Modal opened={opened} onClose={close} title='Create Post' size='lg'>
				<form onSubmit={handleSubmit}>
					<Stack>
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
							Post
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
