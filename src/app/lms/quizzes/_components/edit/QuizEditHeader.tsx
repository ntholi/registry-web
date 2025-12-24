'use client';

import type { MoodleCourse } from '@lms/courses';
import type { MoodleQuiz } from '@lms/quizzes';
import {
	Badge,
	Button,
	Flex,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconArrowNarrowLeft,
	IconEdit,
	IconExternalLink,
} from '@tabler/icons-react';
import Link from '@/shared/ui/Link';

type Props = {
	quiz: MoodleQuiz;
	course: MoodleCourse;
};

export default function QuizEditHeader({ quiz, course }: Props) {
	return (
		<Stack>
			<Link c='gray' href={`/lms/courses/${course.id}/quizzes/${quiz.id}`}>
				<Group align='center'>
					<ThemeIcon radius='xl' variant='light' color='gray'>
						<IconArrowNarrowLeft size='1.2rem' />
					</ThemeIcon>
					<Text size='sm'>Back to {quiz.name}</Text>
				</Group>
			</Link>
			<Paper p='xl' withBorder>
				<Flex align='start' gap='md' justify='space-between'>
					<Flex align='center' gap='md'>
						<ThemeIcon size={60} variant='default'>
							<IconEdit size='1.5rem' />
						</ThemeIcon>
						<Stack gap={1}>
							<Group gap='xs'>
								<Badge size='sm' variant='default' radius='xs'>
									{course.shortname || course.fullname}
								</Badge>
								<Badge size='sm' variant='light' color='blue' radius='xs'>
									Editing
								</Badge>
							</Group>
							<Title order={2}>{quiz.name}</Title>
						</Stack>
					</Flex>
					{quiz.coursemoduleid && (
						<Button
							component='a'
							href={`${process.env.NEXT_PUBLIC_MOODLE_URL}/mod/quiz/view.php?id=${quiz.coursemoduleid}`}
							target='_blank'
							rel='noopener noreferrer'
							rightSection={<IconExternalLink size={16} />}
							variant='default'
							size='xs'
						>
							Open in Moodle
						</Button>
					)}
				</Flex>
			</Paper>
		</Stack>
	);
}
