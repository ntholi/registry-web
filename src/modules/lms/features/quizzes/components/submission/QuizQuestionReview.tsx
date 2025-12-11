'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Group,
	NumberInput,
	Paper,
	Stack,
	Text,
	Textarea,
	TypographyStylesProvider,
} from '@mantine/core';
import { IconCheck, IconEdit, IconMinus, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { gradeEssayQuestion } from '../../server/actions';
import type { QuizAttemptQuestion } from '../../types';

type Props = {
	question: QuizAttemptQuestion;
	attemptId: number;
	quizId: number;
};

function getStateColor(
	state: string
): 'green' | 'red' | 'yellow' | 'orange' | 'gray' {
	switch (state) {
		case 'gradedright':
			return 'green';
		case 'gradedwrong':
			return 'red';
		case 'gradedpartial':
			return 'yellow';
		case 'needsgrading':
			return 'orange';
		case 'gaveup':
			return 'gray';
		default:
			return 'gray';
	}
}

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

function getQuestionTypeLabel(type: string): string {
	switch (type) {
		case 'multichoice':
			return 'Multiple Choice';
		case 'truefalse':
			return 'True/False';
		case 'shortanswer':
			return 'Short Answer';
		case 'essay':
			return 'Essay';
		case 'numerical':
			return 'Numerical';
		case 'match':
			return 'Matching';
		case 'description':
			return 'Description';
		default:
			return type;
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

	return (
		<Paper withBorder p='md'>
			<Stack gap='sm'>
				<Group justify='space-between'>
					<Group gap='xs'>
						<Text size='sm' fw={600}>
							Q{question.slot}
						</Text>
						<Badge size='xs' variant='light' color='gray'>
							{getQuestionTypeLabel(question.type)}
						</Badge>
						<Badge
							size='xs'
							variant='light'
							color={getStateColor(question.state)}
							leftSection={getStateIcon(question.state)}
						>
							{getStateLabel(question.state)}
						</Badge>
					</Group>
					<Group gap='xs'>
						<Text size='sm' c='dimmed'>
							{question.mark !== null
								? `${question.mark.toFixed(1)} / ${question.maxmark}`
								: `- / ${question.maxmark}`}
						</Text>
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

				<TypographyStylesProvider>
					<Box
						dangerouslySetInnerHTML={{ __html: question.questiontext }}
						style={{ fontSize: '0.875rem' }}
					/>
				</TypographyStylesProvider>

				{question.response && (
					<Box>
						<Text size='xs' c='dimmed' mb={4}>
							Student Response
						</Text>
						<Card p='sm' withBorder>
							{isEssay ? (
								<TypographyStylesProvider>
									<Box
										dangerouslySetInnerHTML={{ __html: question.response }}
										style={{ fontSize: '0.875rem' }}
									/>
								</TypographyStylesProvider>
							) : (
								<Text size='sm'>{question.response}</Text>
							)}
						</Card>
					</Box>
				)}

				{question.rightanswer && !isEssay && (
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
