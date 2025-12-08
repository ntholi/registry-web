'use client';

import {
	Accordion,
	ActionIcon,
	Badge,
	Checkbox,
	Divider,
	Group,
	NumberInput,
	Paper,
	Radio,
	SegmentedControl,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
	ThemeIcon,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type {
	EssayQuestion,
	MultiChoiceQuestion,
	Question,
	QuestionType,
	ShortAnswerQuestion,
	TrueFalseQuestion,
} from '../../types';
import { truncateText } from '@/shared/lib/utils/utils';

type QuestionCardProps = {
	question: Question;
	index: number;
	onUpdate: (index: number, question: Question) => void;
	onDelete: (index: number) => void;
};

const QUESTION_TYPE_OPTIONS = [
	{ value: 'multichoice', label: 'Multiple Choice' },
	{ value: 'truefalse', label: 'True/False' },
	{ value: 'shortanswer', label: 'Short Answer' },
	{ value: 'essay', label: 'Essay' },
];

function createDefaultQuestion(type: QuestionType, index: number): Question {
	const baseName = `Question ${index + 1}`;

	switch (type) {
		case 'multichoice':
			return {
				type: 'multichoice',
				name: baseName,
				questionText: '',
				defaultMark: 1,
				single: true,
				answers: [
					{ text: '', fraction: 1, feedback: '' },
					{ text: '', fraction: 0, feedback: '' },
					{ text: '', fraction: 0, feedback: '' },
					{ text: '', fraction: 0, feedback: '' },
				],
			};
		case 'truefalse':
			return {
				type: 'truefalse',
				name: baseName,
				questionText: '',
				defaultMark: 1,
				correctAnswer: true,
			};
		case 'shortanswer':
			return {
				type: 'shortanswer',
				name: baseName,
				questionText: '',
				defaultMark: 1,
				useCase: false,
				answers: [{ text: '', fraction: 1, feedback: '' }],
			};
		case 'essay':
			return {
				type: 'essay',
				name: baseName,
				questionText: '',
				defaultMark: 5,
				responseFormat: 'editor',
				responseFieldLines: 15,
				attachments: 0,
			};
	}
}

function MultiChoiceEditor({
	question,
	onUpdate,
}: {
	question: MultiChoiceQuestion;
	onUpdate: (q: MultiChoiceQuestion) => void;
}) {
	const updateAnswer = (
		answerIndex: number,
		field: 'text' | 'fraction',
		value: string | number
	) => {
		const newAnswers = [...question.answers];
		if (field === 'text') {
			newAnswers[answerIndex] = {
				...newAnswers[answerIndex],
				text: value as string,
			};
		} else {
			if (question.single) {
				newAnswers.forEach((a, i) => {
					newAnswers[i] = { ...a, fraction: i === answerIndex ? 1 : 0 };
				});
			} else {
				newAnswers[answerIndex] = {
					...newAnswers[answerIndex],
					fraction: value as number,
				};
			}
		}
		onUpdate({ ...question, answers: newAnswers });
	};

	const addAnswer = () => {
		onUpdate({
			...question,
			answers: [...question.answers, { text: '', fraction: 0, feedback: '' }],
		});
	};

	const removeAnswer = (index: number) => {
		if (question.answers.length <= 2) return;
		const newAnswers = question.answers.filter((_, i) => i !== index);
		onUpdate({ ...question, answers: newAnswers });
	};

	return (
		<Stack gap='sm'>
			<SegmentedControl
				value={question.single ? 'single' : 'multiple'}
				onChange={(v) => onUpdate({ ...question, single: v === 'single' })}
				data={[
					{ value: 'single', label: 'Single answer' },
					{ value: 'multiple', label: 'Multiple answers' },
				]}
			/>
			<Text size='xs' c='dimmed'>
				Options (mark correct answer{question.single ? '' : 's'}):
			</Text>
			{question.answers.map((answer, i) => (
				<Group key={i} gap='xs' align='flex-start'>
					{question.single ? (
						<Radio
							checked={answer.fraction === 1}
							onChange={() => updateAnswer(i, 'fraction', 1)}
							mt={8}
						/>
					) : (
						<Checkbox
							checked={answer.fraction > 0}
							onChange={(e) =>
								updateAnswer(i, 'fraction', e.target.checked ? 1 : 0)
							}
							mt={8}
						/>
					)}
					<TextInput
						placeholder={`Option ${i + 1}`}
						value={answer.text}
						onChange={(e) => updateAnswer(i, 'text', e.target.value)}
						style={{ flex: 1 }}
					/>
					<ActionIcon
						variant='subtle'
						color='red'
						onClick={() => removeAnswer(i)}
						disabled={question.answers.length <= 2}
						mt={4}
					>
						<IconTrash size={16} />
					</ActionIcon>
				</Group>
			))}
			<Text c='blue' style={{ cursor: 'pointer' }} onClick={addAnswer}>
				+ Add option
			</Text>
		</Stack>
	);
}

function TrueFalseEditor({
	question,
	onUpdate,
}: {
	question: TrueFalseQuestion;
	onUpdate: (q: TrueFalseQuestion) => void;
}) {
	return (
		<Radio.Group
			value={question.correctAnswer ? 'true' : 'false'}
			onChange={(v) => onUpdate({ ...question, correctAnswer: v === 'true' })}
			label='Correct answer:'
		>
			<Group mt='xs'>
				<Radio value='true' label='True' />
				<Radio value='false' label='False' />
			</Group>
		</Radio.Group>
	);
}

function ShortAnswerEditor({
	question,
	onUpdate,
}: {
	question: ShortAnswerQuestion;
	onUpdate: (q: ShortAnswerQuestion) => void;
}) {
	const updateAnswer = (index: number, value: string) => {
		const newAnswers = [...question.answers];
		newAnswers[index] = { ...newAnswers[index], text: value };
		onUpdate({ ...question, answers: newAnswers });
	};

	const addAnswer = () => {
		onUpdate({
			...question,
			answers: [...question.answers, { text: '', fraction: 1, feedback: '' }],
		});
	};

	const removeAnswer = (index: number) => {
		if (question.answers.length <= 1) return;
		const newAnswers = question.answers.filter((_, i) => i !== index);
		onUpdate({ ...question, answers: newAnswers });
	};

	return (
		<Stack gap='sm'>
			<Checkbox
				label='Case sensitive'
				checked={question.useCase}
				onChange={(e) => onUpdate({ ...question, useCase: e.target.checked })}
			/>
			<Text size='xs' c='dimmed'>
				Accepted answers:
			</Text>
			{question.answers.map((answer, i) => (
				<Group key={i} gap='xs'>
					<TextInput
						placeholder={`Accepted answer ${i + 1}`}
						value={answer.text}
						onChange={(e) => updateAnswer(i, e.target.value)}
						style={{ flex: 1 }}
					/>
					<ActionIcon
						variant='subtle'
						color='red'
						onClick={() => removeAnswer(i)}
						disabled={question.answers.length <= 1}
					>
						<IconTrash size={16} />
					</ActionIcon>
				</Group>
			))}
			<Text
				size='sm'
				c='blue'
				style={{ cursor: 'pointer' }}
				onClick={addAnswer}
			>
				+ Add accepted answer
			</Text>
		</Stack>
	);
}

function EssayEditor({
	question,
	onUpdate,
}: {
	question: EssayQuestion;
	onUpdate: (q: EssayQuestion) => void;
}) {
	return (
		<Stack gap='sm'>
			<Select
				label='Response format'
				value={question.responseFormat}
				onChange={(v) =>
					onUpdate({
						...question,
						responseFormat:
							(v as 'editor' | 'plain' | 'monospaced') || 'editor',
					})
				}
				data={[
					{ value: 'editor', label: 'HTML editor' },
					{ value: 'plain', label: 'Plain text' },
					{ value: 'monospaced', label: 'Monospaced (for code)' },
				]}
			/>
			<NumberInput
				label='Response field lines'
				value={question.responseFieldLines}
				onChange={(v) =>
					onUpdate({ ...question, responseFieldLines: Number(v) || 15 })
				}
				min={5}
				max={50}
			/>
			<NumberInput
				label='Allowed attachments'
				value={question.attachments}
				onChange={(v) => onUpdate({ ...question, attachments: Number(v) || 0 })}
				min={0}
				max={10}
			/>
		</Stack>
	);
}

export default function QuestionCard({
	question,
	index,
	onUpdate,
	onDelete,
}: QuestionCardProps) {
	const handleTypeChange = (newType: string | null) => {
		if (!newType) return;
		const newQuestion = createDefaultQuestion(newType as QuestionType, index);
		newQuestion.questionText = question.questionText;
		newQuestion.name = question.name;
		onUpdate(index, newQuestion);
	};

	const handleQuestionUpdate = (updatedQuestion: Question) => {
		onUpdate(index, updatedQuestion);
	};

	const questionTypeLabel =
		QUESTION_TYPE_OPTIONS.find((t) => t.value === question.type)?.label ||
		question.type;

	return (
		<Accordion.Item value={`question-${index}`} mb='md'>
			<Accordion.Control>
				<Group wrap='nowrap' align='center'>
					<ThemeIcon size='lg' radius='xl' variant='light' color='blue'>
						<Text size='sm' fw={700}>
							{index + 1}
						</Text>
					</ThemeIcon>

					<Stack gap={2} style={{ flex: 1 }}>
						<Text size='sm' fw={600} lineClamp={1}>
							{truncateText(question.questionText) || 'Untitled Question'}
						</Text>
						<Group gap='xs' align='center'>
							<Badge
								variant='transparent'
								p={0}
								size='sm'
								c='dimmed'
								fw={500}
								style={{ textTransform: 'none' }}
							>
								{questionTypeLabel}
							</Badge>
							<Divider orientation='vertical' h={12} />
							<Text size='xs' c='dimmed'>
								{question.defaultMark}{' '}
								{question.defaultMark === 1 ? 'mark' : 'marks'}
							</Text>
						</Group>
					</Stack>
				</Group>
			</Accordion.Control>
			<Accordion.Panel>
				<Divider mb='lg' />
				<Stack gap='lg'>
					<Group align='flex-start'>
						<Select
							label='Question type'
							value={question.type}
							onChange={handleTypeChange}
							data={QUESTION_TYPE_OPTIONS}
							style={{ flex: 1 }}
						/>
						<NumberInput
							label='Marks'
							value={question.defaultMark}
							onChange={(v) =>
								handleQuestionUpdate({
									...question,
									defaultMark: Number(v) || 1,
								})
							}
							min={1}
							max={100}
							style={{ width: 100 }}
						/>
						<ActionIcon
							variant='light'
							color='red'
							size='lg'
							mt={25}
							onClick={() => onDelete(index)}
							aria-label='Delete question'
						>
							<IconTrash size={18} />
						</ActionIcon>
					</Group>

					<Textarea
						label='Question Text'
						placeholder='Enter your question here...'
						value={question.questionText}
						onChange={(e) =>
							handleQuestionUpdate({
								...question,
								questionText: e.target.value,
							})
						}
						minRows={3}
						autosize
					/>

					<Paper withBorder p='md' radius='md'>
						{question.type === 'multichoice' && (
							<MultiChoiceEditor
								question={question}
								onUpdate={(q) => handleQuestionUpdate(q)}
							/>
						)}
						{question.type === 'truefalse' && (
							<TrueFalseEditor
								question={question}
								onUpdate={(q) => handleQuestionUpdate(q)}
							/>
						)}
						{question.type === 'shortanswer' && (
							<ShortAnswerEditor
								question={question}
								onUpdate={(q) => handleQuestionUpdate(q)}
							/>
						)}
						{question.type === 'essay' && (
							<EssayEditor
								question={question}
								onUpdate={(q) => handleQuestionUpdate(q)}
							/>
						)}
					</Paper>
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}

export { createDefaultQuestion };
