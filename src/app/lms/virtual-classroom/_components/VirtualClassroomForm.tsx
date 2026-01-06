'use client';

import {
	Button,
	Checkbox,
	Group,
	Modal,
	NumberInput,
	Stack,
	Textarea,
	TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconVideo } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import { createBigBlueButtonSession } from '../_server/actions';

const schema = z.object({
	name: z.string().min(1, 'Session name is required'),
	welcome: z.string().optional(),
	intro: z.string().optional(),
	record: z.boolean().default(true),
	wait: z.boolean().default(true),
	muteonstart: z.boolean().default(true),
	userlimit: z.number().min(0).default(0),
	openingtime: z.date().nullable().optional(),
	closingtime: z.date().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

type VirtualClassroomFormProps = {
	courseId: number;
};

export default function VirtualClassroomForm({
	courseId,
}: VirtualClassroomFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			name: '',
			welcome: '',
			intro: '',
			record: true,
			wait: false,
			muteonstart: true,
			userlimit: 0,
			openingtime: null,
			closingtime: null,
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			return createBigBlueButtonSession({
				courseid: courseId,
				name: values.name,
				welcome: values.welcome,
				intro: values.intro,
				record: values.record ? 1 : 0,
				wait: values.wait ? 1 : 0,
				muteonstart: values.muteonstart ? 1 : 0,
				userlimit: values.userlimit,
				openingtime: values.openingtime
					? Math.floor(values.openingtime.getTime() / 1000)
					: undefined,
				closingtime: values.closingtime
					? Math.floor(values.closingtime.getTime() / 1000)
					: undefined,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Virtual classroom session created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['virtual-classroom', courseId],
			});
			form.reset();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create virtual classroom session',
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
				New
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Create Virtual Classroom Session'
				size='lg'
			>
				<form onSubmit={handleSubmit}>
					<Stack>
						<TextInput
							label='Session Name'
							placeholder='Enter session name'
							required
							leftSection={<IconVideo size={16} />}
							{...form.getInputProps('name')}
						/>

						<Textarea
							label='Welcome Message'
							placeholder='Message displayed when participants join'
							autosize
							minRows={2}
							{...form.getInputProps('welcome')}
						/>

						<Textarea
							label='Description'
							placeholder='Session description (optional)'
							autosize
							minRows={2}
							{...form.getInputProps('intro')}
						/>

						<NumberInput
							label='Participant Limit'
							description='Maximum number of participants (0 = unlimited)'
							min={0}
							{...form.getInputProps('userlimit')}
						/>

						<Group grow>
							<DateTimePicker
								label='Opening Time'
								placeholder='Select opening time (optional)'
								clearable
								{...form.getInputProps('openingtime')}
							/>
							<DateTimePicker
								label='Closing Time'
								placeholder='Select closing time (optional)'
								clearable
								{...form.getInputProps('closingtime')}
							/>
						</Group>

						<Group>
							<Checkbox
								label='Enable Recording'
								{...form.getInputProps('record', { type: 'checkbox' })}
							/>
							<Checkbox
								label='Wait for Moderator'
								{...form.getInputProps('wait', { type: 'checkbox' })}
							/>
							<Checkbox
								label='Mute on Start'
								{...form.getInputProps('muteonstart', { type: 'checkbox' })}
							/>
						</Group>

						<Button type='submit' loading={mutation.isPending}>
							Create Session
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
