'use client';

import {
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCheck,
	IconCircleNumber1,
	IconHash,
	IconLetterA,
	IconTextCaption,
} from '@tabler/icons-react';
import type { MoodleQuizQuestion } from '../../types';

type Props = {
	questions: MoodleQuizQuestion[];
};

export default function QuestionPreview({ questions }: Props) {
	if (!questions || questions.length === 0) {
		return (
			<Paper p='xl' withBorder ta='center'>
				<Stack align='center' gap='md'>
					<ThemeIcon size='xl' variant='light' color='gray' radius='xl'>
						<IconCircleNumber1 size={24} />
					</ThemeIcon>
					<Text c='dimmed'>No questions have been added to this quiz yet.</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			{questions.map((question, index) => (
				<QuestionCard
					key={question.slotid || question.questionid}
					question={question}
					index={index}
				/>
			))}
		</Stack>
	);
}

function QuestionAnswerPreview({ question }: { question: MoodleQuizQuestion }) {
	const { qtype, answers, correctanswer } = question;

	switch (qtype) {
		case 'multichoice':
			if (!answers || answers.length === 0) {
				return (
					<Text size='sm' c='dimmed'>
						No answer options available
					</Text>
				);
			}
			return (
				<Stack gap='xs'>
					{answers.map((answer, index) => {
						const isCorrect = answer.fraction > 0;
						const answerText = stripHtml(answer.answer);
						return (
							<Group key={answer.id} gap='xs' wrap='nowrap'>
								<ThemeIcon
									size='sm'
									variant='light'
									color={isCorrect ? 'green' : 'gray'}
									radius='xl'
								>
									{isCorrect ? (
										<IconCheck size={12} />
									) : (
										<Text size='xs'>{String.fromCharCode(65 + index)}</Text>
									)}
								</ThemeIcon>
								<Text size='sm' fw={isCorrect ? 600 : 400}>
									{answerText}
								</Text>
							</Group>
						);
					})}
				</Stack>
			);
		case 'truefalse':
			return (
				<Text size='sm' fw={600}>
					{correctanswer === 1 ? 'True' : 'False'}
				</Text>
			);
		case 'shortanswer':
			if (!answers || answers.length === 0) {
				return (
					<Text size='sm' c='dimmed'>
						No correct answers defined
					</Text>
				);
			}
			return (
				<Stack gap='xs'>
					{answers
						.filter((a) => (a.fraction ?? 0) > 0)
						.map((answer) => (
							<Text key={answer.id} size='sm' fw={600}>
								{stripHtml(answer.answer)}
							</Text>
						))}
				</Stack>
			);
		case 'essay':
			return (
				<Text size='sm' c='dimmed'>
					Graded manually
				</Text>
			);
		case 'numerical':
			if (!answers || answers.length === 0) {
				return (
					<Text size='sm' c='dimmed'>
						No correct answers defined
					</Text>
				);
			}
			return (
				<Stack gap='xs'>
					{answers
						.filter((a) => (a.fraction ?? 0) > 0)
						.map((answer) => (
							<Text key={answer.id} size='sm' fw={600}>
								{stripHtml(answer.answer)}
							</Text>
						))}
				</Stack>
			);
		default:
			return (
				<Text size='sm' c='dimmed'>
					Answer input will be shown to students
				</Text>
			);
	}
}

function QuestionCard({
	question,
	index,
}: {
	question: MoodleQuizQuestion;
	index: number;
}) {
	const typeInfo = getQuestionTypeInfo(question.qtype);
	const questionText = stripHtml(question.questiontext);

	return (
		<Paper p='md' withBorder>
			<Stack gap='xs'>
				<Group wrap='nowrap' align='center' gap='sm'>
					<ThemeIcon size='md' radius='xl' variant='light' color='blue'>
						<Text size='xs' fw={700}>
							{index + 1}
						</Text>
					</ThemeIcon>

					<Stack gap={2} style={{ flex: 1 }}>
						<Text size='sm' fw={600} lineClamp={1}>
							{question.questionname || 'Untitled Question'}
						</Text>
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
								{question.defaultmark}{' '}
								{question.defaultmark === 1 ? 'mark' : 'marks'}
							</Text>
						</Group>
					</Stack>
				</Group>

				<Text size='sm' style={{ lineHeight: 1.5 }}>
					{questionText || 'No question text available'}
				</Text>

				<Box>
					<Divider label='Answer' labelPosition='center' />
					<QuestionAnswerPreview question={question} />
				</Box>
			</Stack>
		</Paper>
	);
}

function stripHtml(html: string): string {
	const div =
		typeof document !== 'undefined' ? document.createElement('div') : null;
	if (div) {
		div.innerHTML = html;
		return div.textContent || div.innerText || '';
	}
	return html.replace(/<[^>]*>/g, '');
}

function getQuestionTypeInfo(qtype: string): {
	label: string;
	color: string;
	icon: React.ReactNode;
} {
	switch (qtype) {
		case 'multichoice':
			return {
				label: 'Multiple Choice',
				color: 'blue',
				icon: <IconLetterA size={14} />,
			};
		case 'truefalse':
			return {
				label: 'True/False',
				color: 'green',
				icon: <IconCheck size={14} />,
			};
		case 'shortanswer':
			return {
				label: 'Short Answer',
				color: 'orange',
				icon: <IconTextCaption size={14} />,
			};
		case 'essay':
			return {
				label: 'Essay',
				color: 'violet',
				icon: <IconTextCaption size={14} />,
			};
		case 'numerical':
			return {
				label: 'Numerical',
				color: 'cyan',
				icon: <IconHash size={14} />,
			};
		default:
			return {
				label: qtype,
				color: 'gray',
				icon: <IconCircleNumber1 size={14} />,
			};
	}
}
