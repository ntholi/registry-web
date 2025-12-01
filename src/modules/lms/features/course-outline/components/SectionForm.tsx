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
import { addCourseSection } from '../server/actions';

const schema = z.object({
	title: z.string().min(1, 'Title is required'),
	content: z.string().min(1, 'Content is required'),
	pagenum: z.number().min(0, 'Position must be 0 or greater'),
});

type FormValues = z.infer<typeof schema>;

type SectionFormProps = {
	courseId: number;
};

export default function SectionForm({ courseId }: SectionFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			title: '',
			content: '',
			pagenum: 0,
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			return addCourseSection(courseId, values);
		},
		onSuccess: () => {
			notifications.show({
				message: 'Section created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['course-outline', courseId],
			});
			form.reset();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create section',
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
				Add Section
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Add Course Section'
				size='lg'
			>
				<form onSubmit={handleSubmit}>
					<Stack>
						<TextInput
							label='Section Title'
							placeholder='Enter section title'
							required
							{...form.getInputProps('title')}
						/>

						<NumberInput
							label='Position'
							description='Order of the section (0 appends at end)'
							placeholder='0'
							min={0}
							{...form.getInputProps('pagenum')}
						/>

						<RichTextField
							label='Content'
							height={300}
							{...form.getInputProps('content')}
						/>

						<Button type='submit' loading={mutation.isPending}>
							Create Section
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
