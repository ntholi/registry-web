'use client';

import {
	Button,
	FileInput,
	Grid,
	Modal,
	Stack,
	Tabs,
	TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconUpload } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import RichTextField from '@/shared/ui/adease/RichTextField';
import { createAssignment } from '../server/actions';

const schema = z.object({
	name: z.string().min(1, 'Assignment name is required'),
	availableFrom: z.string().nullable(),
	dueDate: z
		.string()
		.nullable()
		.refine((val) => val !== null && val !== '', {
			message: 'Due date is required',
		}),
	description: z.string().min(1, 'Description is required'),
	activityInstructions: z.string().optional(),
	attachments: z.array(z.instanceof(File)).optional(),
});

type FormValues = z.infer<typeof schema>;

type AssessmentFormProps = {
	courseId: number;
};

export default function AssessmentForm({ courseId }: AssessmentFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			name: '',
			availableFrom: null,
			dueDate: null,
			description: '',
			activityInstructions: '',
			attachments: [],
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			if (!values.dueDate) {
				throw new Error('Due date is required');
			}

			return createAssignment({
				courseid: courseId,
				name: values.name,
				intro: values.description,
				allowsubmissionsfromdate: values.availableFrom
					? Math.floor(new Date(values.availableFrom).getTime() / 1000)
					: 0,
				duedate: Math.floor(new Date(values.dueDate).getTime() / 1000),
				activityinstructions: values.activityInstructions,
				attachments: values.attachments,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Assignment created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['course-assignments', courseId],
			});
			form.reset();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create assignment',
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
				New Assignment
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Create Assessment'
				size='lg'
			>
				<form onSubmit={handleSubmit}>
					<Tabs defaultValue='general'>
						<Tabs.List>
							<Tabs.Tab value='general'>General</Tabs.Tab>
							<Tabs.Tab value='instructions'>Activity Instructions</Tabs.Tab>
							<Tabs.Tab value='attachments'>Attachments</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='general' pt='md'>
							<Stack>
								<TextInput
									label='Assessment Name'
									placeholder='Eg. Assessment 1'
									required
									{...form.getInputProps('name')}
								/>

								<Grid>
									<Grid.Col span={6}>
										<DateTimePicker
											label='Available From'
											placeholder='Select date and time'
											{...form.getInputProps('availableFrom')}
										/>
									</Grid.Col>
									<Grid.Col span={6}>
										<DateTimePicker
											label='Due Date'
											placeholder='Select date and time'
											required
											{...form.getInputProps('dueDate')}
										/>
									</Grid.Col>
								</Grid>

								<RichTextField
									label='Description'
									height={250}
									required
									{...form.getInputProps('description')}
								/>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='instructions' pt='md'>
							<RichTextField
								label='Activity Instructions'
								height={350}
								{...form.getInputProps('activityInstructions')}
							/>
						</Tabs.Panel>

						<Tabs.Panel value='attachments' pt='md'>
							<Stack>
								<FileInput
									label='Attachments'
									placeholder='Upload files'
									multiple
									leftSection={<IconUpload size={16} />}
									{...form.getInputProps('attachments')}
								/>
							</Stack>
						</Tabs.Panel>
					</Tabs>

					<Button type='submit' loading={mutation.isPending} fullWidth mt='xl'>
						Create Assignment
					</Button>
				</form>
			</Modal>
		</>
	);
}
