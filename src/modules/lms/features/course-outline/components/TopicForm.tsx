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
import { createTopic } from '../server/actions';

const topicSchema = z.object({
	weekNumber: z.number().min(1, 'Week number must be at least 1'),
	title: z.string().min(1, 'Topic title is required'),
	description: z.string().min(1, 'Description is required'),
});

type TopicFormValues = z.infer<typeof topicSchema>;

type TopicFormProps = {
	courseId: number;
	nextWeekNumber: number;
};

export default function TopicForm({
	courseId,
	nextWeekNumber,
}: TopicFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<TopicFormValues>({
		validate: zodResolver(topicSchema),
		initialValues: {
			weekNumber: nextWeekNumber,
			title: '',
			description: '',
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: TopicFormValues) => {
			return createTopic({
				courseId,
				weekNumber: values.weekNumber,
				title: values.title,
				description: values.description,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Topic created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['course-outline', courseId],
			});
			form.reset();
			form.setFieldValue('weekNumber', nextWeekNumber + 1);
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create topic',
				color: 'red',
			});
		},
	});

	function handleClose() {
		close();
		form.reset();
		form.setFieldValue('weekNumber', nextWeekNumber);
	}

	function handleSubmit(values: TopicFormValues) {
		mutation.mutate(values);
	}

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
				title='Add Course Topic'
				size='lg'
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack>
						<NumberInput
							label='Week Number'
							description='The week this topic is covered'
							min={1}
							required
							{...form.getInputProps('weekNumber')}
						/>

						<TextInput
							label='Topic Title'
							placeholder='Enter topic title'
							required
							{...form.getInputProps('title')}
						/>

						<RichTextField
							label='Description'
							height={250}
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
