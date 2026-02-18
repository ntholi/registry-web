'use client';

import { Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '../../categories/_server/actions';
import CategoryForm from './CategoryForm';

export default function CreateCategoryModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (values: { name: string }) => {
			return createCategory(values);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedback-question-board'] });
			notifications.show({
				title: 'Category Created',
				message: 'The category has been added successfully',
				color: 'green',
			});
			close();
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to create category',
				color: 'red',
			});
		},
	});

	return (
		<>
			<Button
				variant='default'
				leftSection={<IconPlus size={16} />}
				onClick={open}
			>
				Add Category
			</Button>
			<Modal opened={opened} onClose={close} title='New Category' size='md'>
				<CategoryForm
					onSubmit={(v) => mutation.mutate(v)}
					loading={mutation.isPending}
					submitLabel='Create'
					onCancel={close}
				/>
			</Modal>
		</>
	);
}
