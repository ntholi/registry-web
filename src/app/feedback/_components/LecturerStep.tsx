'use client';

import {
	Avatar,
	Badge,
	Box,
	Button,
	Flex,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import QuestionCard from './QuestionCard';

type Lecturer = {
	assignedModuleId: number;
	lecturerName: string | null;
	lecturerImage: string | null;
	moduleCode: string;
	moduleName: string;
};

type Question = {
	categoryId: string;
	categoryName: string;
	questionId: string;
	questionText: string;
};

type ResponseEntry = {
	rating: number | null;
	comment: string | null;
};

type Props = {
	lecturer: Lecturer;
	questions: Question[];
	currentQuestionIndex: number;
	onQuestionIndexChange: (index: number) => void;
	getResponse: (
		assignedModuleId: number,
		questionId: string
	) => ResponseEntry | undefined;
	setResponse: (
		assignedModuleId: number,
		questionId: string,
		entry: ResponseEntry
	) => void;
	onNext: () => void;
	onSkip: () => void;
	isLast: boolean;
	isPending: boolean;
};

export default function LecturerStep({
	lecturer,
	questions,
	currentQuestionIndex,
	onQuestionIndexChange,
	getResponse,
	setResponse,
	onNext,
	onSkip,
	isLast,
	isPending,
}: Props) {
	const question = questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === questions.length - 1;
	const isFirstQuestion = currentQuestionIndex === 0;

	const currentResponse = question
		? getResponse(lecturer.assignedModuleId, question.questionId)
		: undefined;

	return (
		<Stack gap='md'>
			<Paper withBorder p='md' radius='md'>
				<Group align='flex-start' wrap='nowrap'>
					<Avatar src={lecturer.lecturerImage} size='lg' radius='xl'>
						{lecturer.lecturerName
							?.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2)
							.toUpperCase()}
					</Avatar>
					<Stack w={'100%'}>
						<Box>
							<Title order={4}>{lecturer.lecturerName}</Title>
							<Text mt='xs' size='sm' c='dimmed'>
								{lecturer.moduleCode} - {lecturer.moduleName}
							</Text>
						</Box>
						<Flex justify={'flex-end'}>
							<Button
								variant='light'
								color='red'
								size='compact-sm'
								onClick={onSkip}
								loading={isPending}
								ml='auto'
							>
								Skip lecturer
							</Button>
						</Flex>
					</Stack>
				</Group>
			</Paper>

			{question && (
				<QuestionCard
					categoryName={question.categoryName}
					questionText={question.questionText}
					rating={currentResponse?.rating ?? null}
					comment={currentResponse?.comment ?? ''}
					onRatingChange={(rating) =>
						setResponse(lecturer.assignedModuleId, question.questionId, {
							rating,
							comment: currentResponse?.comment ?? null,
						})
					}
					onCommentChange={(comment) =>
						setResponse(lecturer.assignedModuleId, question.questionId, {
							rating: currentResponse?.rating ?? null,
							comment: comment || null,
						})
					}
				/>
			)}

			<Group justify='space-between' align='center'>
				<Text size='sm' c='dimmed'>
					Question {currentQuestionIndex + 1} of {questions.length}
				</Text>
				<Badge variant='dot' size='sm'>
					{
						questions.filter((q) =>
							getResponse(lecturer.assignedModuleId, q.questionId)
						).length
					}{' '}
					/ {questions.length} answered
				</Badge>
			</Group>

			<Group justify='space-between'>
				<Button
					variant='default'
					leftSection={<IconChevronLeft size={16} />}
					onClick={() => onQuestionIndexChange(currentQuestionIndex - 1)}
					disabled={isFirstQuestion}
				>
					Previous
				</Button>

				{isLastQuestion ? (
					<Button
						onClick={onNext}
						loading={isPending}
						rightSection={<IconChevronRight size={16} />}
					>
						{isLast ? 'Submit All' : 'Next Lecturer'}
					</Button>
				) : (
					<Button
						variant='light'
						rightSection={<IconChevronRight size={16} />}
						onClick={() => onQuestionIndexChange(currentQuestionIndex + 1)}
					>
						Next
					</Button>
				)}
			</Group>
		</Stack>
	);
}
