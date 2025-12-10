'use client';

import type { MoodleCourse } from '@lms/courses';
import type { MoodleQuiz } from '@lms/quizzes';
import {
	Anchor,
	Breadcrumbs,
	Divider,
	Group,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconChevronRight, IconEdit } from '@tabler/icons-react';
import Link from 'next/link';

type Props = {
	quiz: MoodleQuiz;
	course: MoodleCourse;
};

export default function QuizEditHeader({ quiz, course }: Props) {
	const breadcrumbItems = [
		{ title: 'Courses', href: '/lms/courses' },
		{
			title: course.shortname || course.fullname,
			href: `/lms/courses/${course.id}`,
		},
		{ title: 'Quizzes', href: `/lms/courses/${course.id}?tab=quizzes` },
		{ title: quiz.name, href: `/lms/courses/${course.id}/quizzes/${quiz.id}` },
		{
			title: 'Edit',
			href: `/lms/courses/${course.id}/quizzes/${quiz.id}/edit`,
		},
	];

	return (
		<Stack gap='lg' mb='lg'>
			<Breadcrumbs
				separator={<IconChevronRight size={14} />}
				separatorMargin={6}
			>
				{breadcrumbItems.map((item, index) => (
					<Anchor
						key={item.href}
						component={Link}
						href={item.href}
						size='sm'
						c={index === breadcrumbItems.length - 1 ? 'dimmed' : undefined}
					>
						{item.title}
					</Anchor>
				))}
			</Breadcrumbs>

			<Group gap='md'>
				<ThemeIcon size='xl' variant='light' color='blue' radius='md'>
					<IconEdit size={24} />
				</ThemeIcon>
				<Stack gap={2}>
					<Title order={2}>Edit Quiz</Title>
					<Text c='dimmed' size='sm'>
						{quiz.name}
					</Text>
				</Stack>
			</Group>

			<Divider />
		</Stack>
	);
}
