'use client';

import { Button, Group, Modal, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createCourse, getUserAssignedModules } from '../server/actions';

export default function NewClassButton() {
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const queryClient = useQueryClient();
	const router = useRouter();

	const { data: modules = [], isLoading } = useQuery({
		queryKey: ['user-assigned-modules'],
		queryFn: getUserAssignedModules,
	});

	const form = useForm({
		initialValues: {
			semesterModuleId: '',
		},
		validate: {
			semesterModuleId: (value) => (!value ? 'Please select a module' : null),
		},
	});

	async function handleSubmit(values: typeof form.values) {
		setIsSubmitting(true);
		try {
			const selectedModule = modules.find(
				(m) => m.semesterModuleId.toString() === values.semesterModuleId
			);

			if (!selectedModule) {
				notifications.show({
					title: 'Error',
					message: 'Selected module not found',
					color: 'red',
				});
				return;
			}

			const result = await createCourse({
				name: selectedModule.moduleName,
				section: selectedModule.programCode,
				subject: selectedModule.moduleCode,
				semesterModuleId: selectedModule.semesterModuleId,
			});

			if (result.success) {
				notifications.show({
					title: 'Success',
					message: 'Class created successfully',
					color: 'green',
				});

				queryClient.invalidateQueries({
					queryKey: ['courses'],
				});

				form.reset();
				close();
				router.refresh();
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to create class',
					color: 'red',
				});
			}
		} catch (error) {
			notifications.show({
				title: 'Error',
				message: `An error occurred while creating the class: ${error}`,
				color: 'red',
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	const moduleOptions = modules.map((module) => ({
		value: module.semesterModuleId.toString(),
		label: `${module.moduleCode} - ${module.moduleName} (${module.programCode})`,
	}));

	return (
		<>
			<Button leftSection={<IconPlus size={16} />} onClick={open}>
				New Class
			</Button>

			<Modal opened={opened} onClose={close} title='Create New Class' size='md'>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Select
						label='Select Module'
						placeholder='Choose a module from your assignments'
						searchable
						data={moduleOptions}
						disabled={isLoading}
						required
						mb='md'
						{...form.getInputProps('semesterModuleId')}
					/>

					<Group justify='flex-end' mt='md'>
						<Button variant='outline' onClick={close} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type='submit' loading={isSubmitting}>
							Create
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
