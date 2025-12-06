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
import { createSection } from '../server/actions';

const sectionSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	content: z.string().min(1, 'Content is required'),
	sectionNumber: z.number().min(1, 'Section number must be at least 1'),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

type SectionFormProps = {
	courseId: number;
	nextSectionNumber: number;
};

export default function SectionForm({
	courseId,
	nextSectionNumber,
}: SectionFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<SectionFormValues>({
		validate: zodResolver(sectionSchema),
		initialValues: {
			title: '',
			content: '',
			sectionNumber: nextSectionNumber,
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: SectionFormValues) => {
			return createSection({
				courseId,
				title: values.title,
				content: values.content,
				sectionNumber: values.sectionNumber,
			});
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
			form.setFieldValue('sectionNumber', nextSectionNumber + 1);
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create section',
				color: 'red',
			});
		},
	});

	function handleClose() {
		close();
		form.reset();
		form.setFieldValue('sectionNumber', nextSectionNumber);
	}

	function handleSubmit(values: SectionFormValues) {
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
				Add Section
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Add Course Section'
				size='lg'
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack>
						<NumberInput
							label='Section Number'
							description='The order/position of this section'
							min={1}
							required
							{...form.getInputProps('sectionNumber')}
						/>

						<TextInput
							label='Title'
							placeholder='Enter section title'
							required
							{...form.getInputProps('title')}
						/>

						<RichTextField
							label='Content'
							height={250}
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
