'use client';

import type { BadgeProps } from '@mantine/core';
import { Badge } from '@mantine/core';
import type { MoodleQuiz } from '../../types';

type Props = {
	quiz: MoodleQuiz;
} & Omit<BadgeProps, 'children' | 'color'>;

export default function QuizStatus({ quiz, ...badgeProps }: Props) {
	const now = Date.now() / 1000;
	const isNotYetOpen = quiz.timeopen > 0 && now < quiz.timeopen;
	const isClosed = quiz.timeclose > 0 && now > quiz.timeclose;

	let color: string;
	let text: string;

	if (isNotYetOpen) {
		color = 'gray';
		text = 'Not yet open';
	} else if (isClosed) {
		color = 'red';
		text = 'Closed';
	} else {
		color = 'green';
		text = 'Open';
	}

	return (
		<Badge color={color} {...badgeProps}>
			{text}
		</Badge>
	);
}
