'use client';

import { ActionIcon, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCategory } from '../../categories/_server/actions';
import CategoryForm from './CategoryForm';

type Props = {
	category: {
		id: number;
		name: string;
	};
};

export default function EditCategoryModal({ category }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (values: { name: string }) => {
			return updateCategory(category.id, values);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedback-question-board'] });
			notifications.show({
				title: 'Category Updated',
				message: 'The category has been updated',
				color: 'green',
			});
			close();
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to update category',
				color: 'red',
			});
		},
	});

	return (
		<>
			<ActionIcon variant='subtle' color='gray' onClick={open} size='sm'>
				<IconEdit size={16} />
			</ActionIcon>
			<Modal opened={opened} onClose={close} title='Edit Category' size='md'>
				<CategoryForm
					initialValues={{ name: category.name }}
					onSubmit={(v) => mutation.mutate(v)}
					loading={mutation.isPending}
					submitLabel='Save'
					onCancel={close}
				/>
			</Modal>
		</>
	);
}
