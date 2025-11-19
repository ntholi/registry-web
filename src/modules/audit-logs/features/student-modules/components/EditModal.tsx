'use client';

import {
	ActionIcon,
	type ActionIconProps,
	Button,
	Group,
	Modal,
	Select,
	Tabs,
	Textarea,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { type Grade, grade } from '@/modules/academic/database/schema/enums';
import {
	type StudentModuleStatus,
	studentModuleStatus,
} from '@/modules/registry/database/schema/enums';
import { updateStudentModule } from '../server/actions';

interface StudentModule {
	id: number;
	status: StudentModuleStatus;
	marks: string;
	grade: Grade;
}

type Props = {
	module: StudentModule;
} & ActionIconProps;

export default function EditStudentModuleModal({ module, ...rest }: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm({
		initialValues: {
			status: module.status,
			marks: module.marks,
			grade: module.grade,
			reasons: '',
		},
	});

	useEffect(() => {
		if (opened) {
			form.setValues({
				status: module.status,
				marks: module.marks,
				grade: module.grade,
				reasons: '',
			});
		}
	}, [opened, module, form.setValues]);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				await updateStudentModule(
					module.id,
					{
						status: values.status as StudentModuleStatus,
						marks: values.marks,
						grade: values.grade as Grade,
					},
					values.reasons
				);

				notifications.show({
					title: 'Success',
					message: 'Student module updated successfully',
					color: 'green',
				});

				queryClient.invalidateQueries({
					queryKey: ['student'],
				});

				form.reset();
				close();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `Failed to update student module: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[module.id, form, close, queryClient]
	);

	return (
		<>
			<ActionIcon
				size='sm'
				variant='subtle'
				color='gray'
				onClick={open}
				style={{
					opacity: 0,
					transition: 'opacity 0.2s',
				}}
				className='edit-module-icon'
				{...rest}
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={close}
				title='Edit Student Module'
				size='md'
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
							<Select
								label='Status'
								placeholder='Select status'
								searchable
								clearable
								data={studentModuleStatus.enumValues.map((s) => ({
									value: s,
									label: s,
								}))}
								required
								mb='md'
								{...form.getInputProps('status')}
							/>

							<TextInput
								label='Marks'
								placeholder='Enter marks'
								required
								mb='md'
								{...form.getInputProps('marks')}
							/>

							<Select
								label='Grade'
								placeholder='Select grade'
								searchable
								clearable
								data={grade.enumValues.map((g) => ({
									value: g,
									label: g,
								}))}
								required
								mb='md'
								{...form.getInputProps('grade')}
							/>
						</Tabs.Panel>

						<Tabs.Panel value='reasons' pt='md'>
							<Textarea
								label='Reasons for Update'
								placeholder='Enter the reason for this update (optional)'
								rows={6}
								{...form.getInputProps('reasons')}
							/>
						</Tabs.Panel>
					</Tabs>

					<Group justify='flex-end' mt='md'>
						<Button variant='outline' onClick={close} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type='submit' loading={isSubmitting}>
							Update
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
