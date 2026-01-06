'use client';

import {
	getModulePrerequisites,
	getSemesterModule,
	updateModule,
} from '@academic/semester-modules';
import { ActionIcon, Button, Group } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import ModuleEditForm from '../structures/_components/ModuleEditForm';

type Props = {
	moduleId: number;
	structureId: number;
};

export default function EditButton({ moduleId, structureId }: Props) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const queryClient = useQueryClient();

	const openEditModal = async () => {
		try {
			const [mod, prerequisites] = await Promise.all([
				getSemesterModule(moduleId),
				getModulePrerequisites(moduleId),
			]);

			if (!mod) {
				throw new Error('Module not found');
			}

			modals.closeAll();
			modals.open({
				title: 'Edit Module Visibility & Prerequisites',
				size: 'md',
				children: (
					<div>
						<ModuleEditForm
							defaultValues={{
								moduleId: mod.id,
								credits: mod.credits,
								module: mod.module!,
								type: mod.type,
								hidden: mod.hidden,
								prerequisiteCodes: prerequisites.map((p) => p.code),
							}}
							structureId={structureId}
							onSubmit={async (values) => {
								setIsSubmitting(true);
								try {
									const result = await updateModule(moduleId, values);
									await Promise.all([
										queryClient.invalidateQueries({
											queryKey: ['module-prerequisites', moduleId],
										}),
										queryClient.invalidateQueries({
											queryKey: ['structure', structureId],
										}),
									]);
									return { ...result, module: values.module };
								} finally {
									setIsSubmitting(false);
								}
							}}
						/>
						<Group justify='flex-end' mt='lg'>
							<Button
								variant='light'
								color='gray'
								onClick={() => modals.closeAll()}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								form='module-edit-form'
								loading={isSubmitting}
							>
								Save Changes
							</Button>
						</Group>
					</div>
				),
			});
		} catch (error) {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error ? error.message : 'Failed to load module',
				color: 'red',
			});
			modals.closeAll();
		}
	};

	return (
		<ActionIcon variant='subtle' onClick={openEditModal}>
			<IconEdit size={'1rem'} />
		</ActionIcon>
	);
}
