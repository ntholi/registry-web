'use client';

import {
	Badge,
	Box,
	Divider,
	Group,
	NumberInput,
	Paper,
	Radio,
	Stack,
	Text,
	Textarea,
	TextInput,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCheck,
	IconCircleNumber1,
	IconHash,
	IconLetterA,
	IconTextCaption,
	IconX,
} from '@tabler/icons-react';
import { truncateText } from '@/shared/lib/utils/utils';
import type { MoodleQuizQuestion } from '../../types';

type Props = {
	questions: MoodleQuizQuestion[];
};

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

function QuestionAnswerPreview({ qtype }: { qtype: string }) {
	switch (qtype) {
		case 'multichoice':
			return (
				<Stack gap='xs'>
					<Radio.Group>
						<Stack gap='xs'>
							<Radio value='a' label='Option A' disabled />
							<Radio value='b' label='Option B' disabled />
							<Radio value='c' label='Option C' disabled />
							<Radio value='d' label='Option D' disabled />
						</Stack>
					</Radio.Group>
				</Stack>
			);
		case 'truefalse':
			return (
				<Group gap='xl'>
					<Group gap='xs'>
						<ThemeIcon size='sm' variant='light' color='green' radius='xl'>
							<IconCheck size={12} />
						</ThemeIcon>
						<Text size='sm'>True</Text>
					</Group>
					<Group gap='xs'>
						<ThemeIcon size='sm' variant='light' color='red' radius='xl'>
							<IconX size={12} />
						</ThemeIcon>
						<Text size='sm'>False</Text>
					</Group>
				</Group>
			);
		case 'shortanswer':
			return (
				<TextInput
					placeholder='Type your answer here...'
					disabled
					styles={{
						input: {
							backgroundColor: 'var(--mantine-color-dark-6)',
							borderColor: 'var(--mantine-color-dark-4)',
						},
					}}
				/>
			);
		case 'essay':
			return (
				<Textarea
					placeholder='Write your essay response here...'
					minRows={4}
					disabled
					styles={{
						input: {
							backgroundColor: 'var(--mantine-color-dark-6)',
							borderColor: 'var(--mantine-color-dark-4)',
						},
					}}
				/>
			);
		case 'numerical':
			return (
				<NumberInput
					placeholder='Enter a number...'
					disabled
					styles={{
						input: {
							backgroundColor: 'var(--mantine-color-dark-6)',
							borderColor: 'var(--mantine-color-dark-4)',
						},
					}}
				/>
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
		<Paper p='lg' withBorder>
			<Stack gap='md'>
				<Group wrap='nowrap' align='center'>
					<ThemeIcon size='lg' radius='xl' variant='light' color='blue'>
						<Text size='sm' fw={700}>
							{index + 1}
						</Text>
					</ThemeIcon>

					<Stack gap={2} style={{ flex: 1 }}>
						<Text size='sm' fw={600} lineClamp={1}>
							{truncateText(questionText) || 'Untitled Question'}
						</Text>
						<Group gap='xs' align='center'>
							<Badge
								variant='transparent'
								p={0}
								size='sm'
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

				<Divider />

				<Box>
					<Text size='sm' style={{ lineHeight: 1.6 }}>
						{questionText || 'No question text available'}
					</Text>
				</Box>

				<Box
					p='md'
					style={{
						backgroundColor: 'var(--mantine-color-dark-7)',
						borderRadius: 'var(--mantine-radius-md)',
					}}
				>
					<QuestionAnswerPreview qtype={question.qtype} />
				</Box>
			</Stack>
		</Paper>
	);
}

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
