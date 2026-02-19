'use client';

import { Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuestion } from '../_server/actions';
import QuestionForm from './QuestionForm';

type Props = {
	categoryId: string;
	categoryName: string;
};

export default function CreateQuestionModal({
	categoryId,
	categoryName,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (values: { categoryId: string; text: string }) => {
			return createQuestion(values);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedback-question-board'] });
			notifications.show({
				title: 'Question Created',
				message: 'The feedback question has been added successfully',
				color: 'green',
			});
			close();
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to create question',
				color: 'red',
			});
		},
	});

	return (
		<>
			<Button
				leftSection={<IconPlus size={16} />}
				onClick={open}
				variant='light'
				size='xs'
			>
				Question
			</Button>
			<Modal
				opened={opened}
				onClose={close}
				title={`New Question • ${categoryName}`}
				size='md'
			>
				<QuestionForm
					categoryId={categoryId}
					onSubmit={(v) => mutation.mutate(v)}
					loading={mutation.isPending}
					submitLabel='Create'
					onCancel={close}
				/>
			</Modal>
		</>
	);
}
