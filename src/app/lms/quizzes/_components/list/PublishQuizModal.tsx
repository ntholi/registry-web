'use client';

import { Button, Modal, NumberInput, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { COURSE_WORK_OPTIONS } from '@/app/academic/assessments/_lib/utils';
import { getAssessmentByModuleId } from '@/app/academic/assessments/_server/actions';
import { publishQuiz } from '../../_server/actions';
import type { MoodleQuiz } from '../../types';

type Props = {
	quiz: MoodleQuiz;
	courseId: number;
	moduleId: number;
	opened: boolean;
	onClose: () => void;
};

type FormValues = {
	assessmentNumber: string;
	weight: number;
	totalMarks: number;
};

export default function PublishQuizModal({
	quiz,
	courseId,
	moduleId,
	opened,
	onClose,
}: Props) {
	const queryClient = useQueryClient();

	const { data: assessments } = useQuery({
		queryKey: ['module-assessments', moduleId],
		queryFn: () => getAssessmentByModuleId(moduleId),
		enabled: opened,
	});

	const usedNumbers = new Set(
		assessments?.map((a) => a.assessmentNumber as string)
	);
	const availableOptions = COURSE_WORK_OPTIONS.filter(
		(o) => !usedNumbers.has(o.value)
	);

	const form = useForm<FormValues>({
		initialValues: {
			assessmentNumber: '',
			weight: 0,
			totalMarks: quiz.grade || 100,
		},
	});

	const setFieldRef = useRef(form.setFieldValue);
	useEffect(() => {
		setFieldRef.current = form.setFieldValue;
	}, [form.setFieldValue]);

	useEffect(() => {
		if (!assessments) return;
		const numbers = assessments
			.map((a) => {
				const match = a.assessmentNumber.match(/CW(\d+)/);
				return match ? Number.parseInt(match[1], 10) : 0;
			})
			.filter((n) => n > 0);
		const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
		if (next <= 15) {
			setFieldRef.current('assessmentNumber', `CW${next}`);
		}
	}, [assessments]);

	const mutation = useMutation({
		mutationFn: () =>
			publishQuiz({
				quizId: quiz.id,
				courseId,
				moduleId,
				assessmentNumber: form.values.assessmentNumber,
				weight: form.values.weight,
				totalMarks: form.values.totalMarks,
			}),
		onSuccess: () => {
			notifications.show({ message: 'Quiz published', color: 'green' });
			queryClient.invalidateQueries({ queryKey: ['course-quizzes'] });
			queryClient.invalidateQueries({
				queryKey: ['module-assessments', moduleId],
			});
			form.reset();
			onClose();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to publish quiz',
				color: 'red',
			});
		},
	});

	function handleSubmit() {
		if (!form.values.assessmentNumber) {
			form.setFieldError('assessmentNumber', 'Required');
			return;
		}
		mutation.mutate();
	}

	return (
		<Modal opened={opened} onClose={onClose} title='Publish Quiz'>
			<Stack>
				<Select
					label='Assessment Number'
					placeholder='Select assessment number'
					data={availableOptions}
					{...form.getInputProps('assessmentNumber')}
				/>
				<NumberInput
					label='Total Marks'
					min={1}
					{...form.getInputProps('totalMarks')}
				/>
				<NumberInput
					label='Weight (%)'
					min={0}
					max={100}
					{...form.getInputProps('weight')}
				/>
				<Button
					onClick={handleSubmit}
					loading={mutation.isPending}
					leftSection={<IconSend size={16} />}
					color='green'
				>
					Publish
				</Button>
			</Stack>
		</Modal>
	);
}
