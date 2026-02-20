'use client';

import {
	ActionIcon,
	Avatar,
	Box,
	Flex,
	Group,
	Paper,
	Stack,
	Text,
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
};

export default function LecturerStep({
	lecturer,
	questions,
	currentQuestionIndex,
	onQuestionIndexChange,
	getResponse,
	setResponse,
}: Props) {
	const question = questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === questions.length - 1;
	const isFirstQuestion = currentQuestionIndex === 0;

	const currentResponse = question
		? getResponse(lecturer.assignedModuleId, question.questionId)
		: undefined;

	return (
		<Stack gap='md'>
			<Paper
				withBorder
				p='sm'
				style={{
					borderColor: 'var(--mantine-color-default-border)',
				}}
			>
				<Group align='center' wrap='nowrap' justify='space-between'>
					<Group align='center' wrap='nowrap' gap='sm'>
						<Avatar
							src={lecturer.lecturerImage}
							size={48}
							radius='xl'
							color='blue'
						>
							{lecturer.lecturerName
								?.split(' ')
								.map((n) => n[0])
								.join('')
								.slice(0, 2)
								.toUpperCase()}
						</Avatar>
						<Box style={{ minWidth: 0 }}>
							<Text fw={600} size='md' lh={1.3}>
								{lecturer.lecturerName}
							</Text>
							<Text size='xs' c='dimmed' truncate>
								{lecturer.moduleCode} — {lecturer.moduleName}
							</Text>
						</Box>
					</Group>
				</Group>
			</Paper>

			{question && (
				<Flex align='center' gap='xs'>
					<ActionIcon
						variant='subtle'
						size='xl'
						radius='xl'
						onClick={() => onQuestionIndexChange(currentQuestionIndex - 1)}
						disabled={isFirstQuestion}
						style={{
							opacity: isFirstQuestion ? 0.25 : 0.7,
							transition: 'opacity 150ms ease, transform 150ms ease',
						}}
						onMouseEnter={(e) => {
							if (!isFirstQuestion) {
								e.currentTarget.style.opacity = '1';
								e.currentTarget.style.transform = 'scale(1.1)';
							}
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.opacity = isFirstQuestion ? '0.25' : '0.7';
							e.currentTarget.style.transform = 'scale(1)';
						}}
					>
						<IconChevronLeft size={22} />
					</ActionIcon>

					<Box style={{ flex: 1, minWidth: 0 }}>
						<QuestionCard
							categoryName={question.categoryName}
							questionText={question.questionText}
							rating={currentResponse?.rating ?? null}
							comment={currentResponse?.comment ?? ''}
							questionIndex={currentQuestionIndex}
							totalQuestions={questions.length}
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
					</Box>

					<ActionIcon
						variant='subtle'
						size='xl'
						radius='xl'
						onClick={() => onQuestionIndexChange(currentQuestionIndex + 1)}
						disabled={isLastQuestion}
						style={{
							opacity: isLastQuestion ? 0.25 : 0.7,
							transition: 'opacity 150ms ease, transform 150ms ease',
						}}
						onMouseEnter={(e) => {
							if (!isLastQuestion) {
								e.currentTarget.style.opacity = '1';
								e.currentTarget.style.transform = 'scale(1.1)';
							}
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.opacity = isLastQuestion ? '0.25' : '0.7';
							e.currentTarget.style.transform = 'scale(1)';
						}}
					>
						<IconChevronRight size={22} />
					</ActionIcon>
				</Flex>
			)}
		</Stack>
	);
}
