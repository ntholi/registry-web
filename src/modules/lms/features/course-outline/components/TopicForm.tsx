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
import { addCourseTopic } from '../server/actions';

const schema = z.object({
	weekNumber: z.number().min(1, 'Week number must be at least 1'),
	title: z.string().min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
});

type FormValues = z.infer<typeof schema>;

type TopicFormProps = {
	courseId: number;
	nextWeekNumber?: number;
};

export default function TopicForm({
	courseId,
	nextWeekNumber = 1,
}: TopicFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			weekNumber: nextWeekNumber,
			title: '',
			description: '',
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			return addCourseTopic(courseId, values);
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
				title='Add Course Topic'
				size='lg'
			>
				<form onSubmit={handleSubmit}>
					<Stack>
						<NumberInput
							label='Week Number'
							placeholder='1'
							required
							min={1}
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
