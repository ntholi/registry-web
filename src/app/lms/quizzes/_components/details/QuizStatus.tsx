'use client';

import { Badge, type BadgeProps } from '@mantine/core';
import { getQuizStatusColor } from '@/shared/lib/utils/colors';
import type { MoodleQuiz } from '../../types';

type Props = {
	quiz: MoodleQuiz;
} & Omit<BadgeProps, 'children' | 'color'>;

export default function QuizStatus({ quiz, ...badgeProps }: Props) {
	const now = Date.now() / 1000;
	const isNotYetOpen = quiz.timeopen > 0 && now < quiz.timeopen;
	const isClosed = quiz.timeclose > 0 && now > quiz.timeclose;
	const isDraft = quiz.visible === 0;

	const { label, color } = getQuizStatusColor(isNotYetOpen, isClosed, isDraft);

	return (
		<Badge color={color} {...badgeProps}>
			{label}
		</Badge>
	);
}
