'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Divider,
	Group,
	NumberInput,
	Paper,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
} from '@mantine/core';
import { getQuizStateColor } from '@student-portal/utils';
import { IconCheck, IconEdit, IconMinus, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { gradeEssayQuestion } from '../../server/actions';
import type { QuizAttemptQuestion } from '../../types';
import { getQuestionTypeInfo, stripHtml } from '../shared/utils';

type Props = {
	question: QuizAttemptQuestion;
	attemptId: number;
	quizId: number;
};

function getStateLabel(state: string): string {
	switch (state) {
		case 'gradedright':
			return 'Correct';
		case 'gradedwrong':
			return 'Incorrect';
		case 'gradedpartial':
			return 'Partial';
		case 'needsgrading':
			return 'Needs Grading';
		case 'gaveup':
			return 'Not Answered';
		case 'todo':
			return 'Not Attempted';
		case 'complete':
			return 'Complete';
		default:
			return state;
	}
}

function getStateIcon(state: string) {
	switch (state) {
		case 'gradedright':
			return <IconCheck size={14} />;
		case 'gradedwrong':
			return <IconX size={14} />;
		case 'gradedpartial':
			return <IconMinus size={14} />;
		default:
			return null;
	}
}

export default function QuizQuestionReview({
	question,
	attemptId,
	quizId,
}: Props) {
	const [isGrading, setIsGrading] = useState(false);
	const [gradeValue, setGradeValue] = useState<number | string>(
		question.mark ?? ''
	);
	const [comment, setComment] = useState(question.feedback || '');
	const queryClient = useQueryClient();

	const gradeMutation = useMutation({
		mutationFn: async () => {
			const mark =
				typeof gradeValue === 'string'
					? Number.parseFloat(gradeValue)
					: gradeValue;
			if (Number.isNaN(mark) || mark < 0 || mark > question.maxmark) {
				throw new Error(`Grade must be between 0 and ${question.maxmark}`);
			}
			return gradeEssayQuestion(attemptId, question.slot, mark, comment);
		},
		onSuccess: () => {
			setIsGrading(false);
			queryClient.invalidateQueries({
				queryKey: ['quiz-attempt-details', attemptId],
			});
			queryClient.invalidateQueries({
				queryKey: ['quiz-submissions', quizId],
			});
		},
	});

	const needsGrading = question.state === 'needsgrading';
	const isEssay = question.type === 'essay';
	const canGrade = isEssay && (needsGrading || question.mark !== null);
	const typeInfo = getQuestionTypeInfo(question.type);
	const questionText = stripHtml(question.questiontext);

	return (
		<Paper withBorder p='md'>
			<Stack gap='sm'>
				<Group wrap='nowrap' align='center' gap='sm'>
					<ThemeIcon size='md' radius='xl' variant='light' color='blue'>
						<Text size='xs' fw={700}>
							{question.slot}
						</Text>
					</ThemeIcon>

					<Stack gap={2} style={{ flex: 1 }}>
						<Group gap='xs' align='center'>
							<Badge
								variant='transparent'
								p={0}
								size='xs'
								c='dimmed'
								fw={500}
								style={{ textTransform: 'none' }}
								leftSection={typeInfo.icon}
							>
								{typeInfo.label}
							</Badge>
							<Divider orientation='vertical' h={12} />
							<Text size='xs' c='dimmed'>
								{question.mark !== null
									? `${question.mark.toFixed(1)} / ${question.maxmark}`
									: `- / ${question.maxmark}`}
							</Text>
						</Group>
					</Stack>

					<Group gap='xs'>
						<Badge
							size='xs'
							variant='light'
							color={getQuizStateColor(question.state)}
							leftSection={getStateIcon(question.state)}
						>
							{getStateLabel(question.state)}
						</Badge>
						{canGrade && !isGrading && (
							<ActionIcon
								size='sm'
								variant='light'
								onClick={() => setIsGrading(true)}
							>
								<IconEdit size={14} />
							</ActionIcon>
						)}
					</Group>
				</Group>

				<Text size='sm' style={{ lineHeight: 1.5 }}>
					{questionText || 'No question text available'}
				</Text>

				{question.response && (
					<Box>
						<Divider label='Student Response' labelPosition='center' mb='xs' />
						<Card p='sm' withBorder>
							<Text size='sm'>
								{isEssay ? stripHtml(question.response) : question.response}
							</Text>
						</Card>
					</Box>
				)}

				{question.rightanswer &&
					!isEssay &&
					question.state === 'gradedwrong' && (
						<Box>
							<Text size='xs' c='dimmed' mb={4}>
								Correct Answer
							</Text>
							<Text size='sm' c='green'>
								{question.rightanswer}
							</Text>
						</Box>
					)}

				{question.feedback && !isGrading && (
					<Box>
						<Text size='xs' c='dimmed' mb={4}>
							Feedback
						</Text>
						<Text size='sm'>{question.feedback}</Text>
					</Box>
				)}

				{isGrading && (
					<Stack gap='sm' mt='xs'>
						<Group gap='sm' align='flex-end'>
							<NumberInput
								label='Grade'
								value={gradeValue}
								onChange={setGradeValue}
								min={0}
								max={question.maxmark}
								step={0.5}
								decimalScale={2}
								w={100}
								size='sm'
							/>
							<Text size='sm' c='dimmed' pb={8}>
								/ {question.maxmark}
							</Text>
						</Group>
						<Textarea
							label='Feedback'
							value={comment}
							onChange={(e) => setComment(e.currentTarget.value)}
							placeholder='Enter feedback for the student...'
							minRows={2}
							size='sm'
						/>
						<Group gap='xs' justify='flex-end'>
							<Button
								size='xs'
								variant='subtle'
								onClick={() => setIsGrading(false)}
							>
								Cancel
							</Button>
							<Button
								size='xs'
								onClick={() => gradeMutation.mutate()}
								loading={gradeMutation.isPending}
							>
								Save Grade
							</Button>
						</Group>
						{gradeMutation.isError && (
							<Text size='xs' c='red'>
								{gradeMutation.error?.message || 'Failed to save grade'}
							</Text>
						)}
					</Stack>
				)}
			</Stack>
		</Paper>
	);
}
