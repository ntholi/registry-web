'use client';

import { Button, Modal, NumberInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import RichTextField from '@/shared/ui/adease/RichTextField';
import { createCourseTopic } from '../server/actions';

const topicSchema = z.object({
	weekNumber: z.number().min(1, 'Week number must be at least 1'),
	name: z.string().min(1, 'Topic name is required'),
	description: z.string().optional(),
});

type TopicFormValues = z.infer<typeof topicSchema>;

type TopicFormProps = {
	courseId: number;
};

export default function TopicForm({ courseId }: TopicFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<TopicFormValues>({
		validate: zodResolver(topicSchema),
		initialValues: {
			weekNumber: 1,
			name: '',
			description: '',
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: TopicFormValues) => {
			return createCourseTopic({
				courseId,
				weekNumber: values.weekNumber,
				name: values.name,
				description: values.description || '',
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Topic created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['course-topics', courseId],
			});
			form.reset();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create topic',
				color: 'red',
			});
		},
	});

	const handleSubmit = form.onSubmit((values) => {
		mutation.mutate(values);
	});

	const handleClose = () => {
		close();
		form.reset();
	};

	return (
		<>
			<Button
				onClick={open}
				variant='light'
				leftSection={<IconPlus size={16} />}
				size='xs'
			>
				Add Topic
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Create Course Topic'
				size='lg'
			>
				<form onSubmit={handleSubmit}>
					<Stack>
						<NumberInput
							label='Week Number'
							placeholder='Enter week number'
							min={1}
							required
							{...form.getInputProps('weekNumber')}
						/>

						<TextInput
							label='Topic Name'
							placeholder='Enter topic name'
							required
							{...form.getInputProps('name')}
						/>

						<RichTextField
							label='Description'
							height={200}
							{...form.getInputProps('description')}
						/>

						<Button type='submit' loading={mutation.isPending}>
							Create Topic
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
