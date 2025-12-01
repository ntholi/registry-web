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
import { createCourseSection } from '../server/actions';

const sectionSchema = z.object({
	name: z.string().min(1, 'Section name is required'),
	content: z.string().min(1, 'Section content is required'),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

type SectionFormProps = {
	courseId: number;
};

export default function SectionForm({ courseId }: SectionFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<SectionFormValues>({
		validate: zodResolver(sectionSchema),
		initialValues: {
			name: '',
			content: '',
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: SectionFormValues) => {
			return createCourseSection({
				courseId,
				name: values.name,
				content: values.content,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Section created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['course-sections', courseId],
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
				title='Create Course Section'
				size='lg'
			>
				<form onSubmit={handleSubmit}>
					<Stack>
						<TextInput
							label='Section Name'
							placeholder='Enter section name'
							required
							{...form.getInputProps('name')}
						/>

						<RichTextField
							label='Section Content'
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
