'use client';

import { ActionIcon, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuestion } from '../_server/actions';
import QuestionForm from './QuestionForm';

type Props = {
	question: {
		id: number;
		categoryId: number;
		text: string;
		active: boolean;
	};
};

export default function EditQuestionModal({ question }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (values: {
			categoryId: number;
			text: string;
			active: boolean;
		}) => {
			return updateQuestion(question.id, values);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedback-questions'] });
			notifications.show({
				title: 'Question Updated',
				message: 'The feedback question has been updated',
				color: 'green',
			});
			close();
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to update question',
				color: 'red',
			});
		},
	});

	return (
		<>
			<ActionIcon variant='subtle' color='gray' onClick={open} size='sm'>
				<IconEdit size={16} />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={close}
				title='Edit Feedback Question'
				size='md'
			>
				<QuestionForm
					initialValues={{
						categoryId: String(question.categoryId),
						text: question.text,
						active: question.active,
					}}
					onSubmit={(v) => mutation.mutate(v)}
					loading={mutation.isPending}
					submitLabel='Save'
					onCancel={close}
				/>
			</Modal>
		</>
	);
}
