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
		id: string;
		categoryId: string;
		categoryName: string;
		text: string;
	};
};

export default function EditQuestionModal({ question }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (values: { categoryId: string; text: string }) => {
			return updateQuestion(question.id, values);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedback-question-board'] });
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
				title={`Edit Question • ${question.categoryName}`}
				size='md'
			>
				<QuestionForm
					categoryId={question.categoryId}
					initialValues={{
						text: question.text,
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
