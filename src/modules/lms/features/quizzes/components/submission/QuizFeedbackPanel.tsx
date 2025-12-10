'use client';

import {
	Button,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { IconCheck, IconMessageCircle, IconSend } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
	addQuizAttemptFeedback,
	getQuizAttemptFeedback,
} from '../../server/actions';

type Props = {
	attemptId: number;
	quizId: number;
};

export default function QuizFeedbackPanel({ attemptId, quizId }: Props) {
	const [feedback, setFeedback] = useState('');
	const [showSuccess, setShowSuccess] = useState(false);
	const queryClient = useQueryClient();

	const { data: existingFeedback, isLoading } = useQuery({
		queryKey: ['quiz-attempt-feedback', attemptId],
		queryFn: () => getQuizAttemptFeedback(attemptId),
		staleTime: 0,
	});

	useEffect(() => {
		if (existingFeedback) {
			setFeedback(existingFeedback);
		}
	}, [existingFeedback]);

	const feedbackMutation = useMutation({
		mutationFn: async () => {
			if (!feedback.trim()) {
				throw new Error('Feedback cannot be empty');
			}
			return addQuizAttemptFeedback(attemptId, feedback);
		},
		onSuccess: () => {
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 2000);
			queryClient.invalidateQueries({
				queryKey: ['quiz-attempt-feedback', attemptId],
			});
			queryClient.invalidateQueries({
				queryKey: ['quiz-submissions', quizId],
			});
		},
	});

	if (isLoading) {
		return (
			<Paper p='md' withBorder>
				<Group justify='center' py='md'>
					<Loader size='sm' />
				</Group>
			</Paper>
		);
	}

	return (
		<Paper p='md' withBorder>
			<Stack gap='md'>
				<Group gap='xs'>
					<IconMessageCircle size={18} />
					<Text fw={600} size='sm'>
						Overall Feedback
					</Text>
				</Group>

				<Text size='sm' c='dimmed'>
					Provide overall feedback for this quiz attempt. This will be visible
					to the student.
				</Text>

				<Textarea
					placeholder='Enter overall feedback for the student...'
					value={feedback}
					onChange={(e) => setFeedback(e.currentTarget.value)}
					minRows={4}
					autosize
				/>

				<Group justify='flex-end' gap='xs'>
					{showSuccess && (
						<Group gap={4}>
							<IconCheck size={16} color='var(--mantine-color-green-6)' />
							<Text size='sm' c='green'>
								Feedback saved
							</Text>
						</Group>
					)}
					<Button
						onClick={() => feedbackMutation.mutate()}
						loading={feedbackMutation.isPending}
						disabled={!feedback.trim()}
						leftSection={<IconSend size={16} />}
						size='sm'
					>
						{existingFeedback ? 'Update Feedback' : 'Send Feedback'}
					</Button>
				</Group>

				{feedbackMutation.isError && (
					<Text size='xs' c='red'>
						{feedbackMutation.error?.message || 'Failed to save feedback'}
					</Text>
				)}
			</Stack>
		</Paper>
	);
}
