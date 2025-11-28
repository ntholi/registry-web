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
import { createPage } from '../server/actions';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	content: z.string().min(1, 'Page content is required'),
});

type FormValues = z.infer<typeof schema>;

type MaterialFormProps = {
	courseId: number;
};

export default function MaterialForm({ courseId }: MaterialFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			name: '',
			content: '',
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			return createPage({
				courseid: courseId,
				name: values.name,
				content: values.content,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Page created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['material-pages', courseId],
			});
			form.reset();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create page',
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
				New
			</Button>

			<Modal opened={opened} onClose={close} title='Create Page' size='lg'>
				<form onSubmit={handleSubmit}>
					<Stack>
						<TextInput
							label='Name'
							placeholder='Enter page name'
							required
							{...form.getInputProps('name')}
						/>

						<RichTextField
							label='Page Content'
							height={300}
							{...form.getInputProps('content')}
						/>

						<Button type='submit' loading={mutation.isPending}>
							Create
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
