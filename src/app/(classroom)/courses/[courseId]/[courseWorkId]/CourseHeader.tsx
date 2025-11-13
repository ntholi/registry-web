'use client';

import { ActionIcon, Badge, Button, Group, Stack, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

type Props = {
	courseId: string;
	courseName: string | null | undefined;
	courseSection: string | null | undefined;
	courseLink?: string | null | undefined;
	courseState?: string | null | undefined;
};

export default function CourseHeader({
	courseId,
	courseName,
	courseSection,
	courseLink,
	courseState,
}: Props) {
	return (
		<Group justify='space-between' align='flex-start'>
			<Group gap='sm' align='flex-start'>
				<ActionIcon
					component={Link}
					href={`/courses/${courseId}`}
					variant='light'
					size='lg'
					radius='xl'
				>
					<IconArrowLeft size='1.1rem' />
				</ActionIcon>
				<Stack gap='4px'>
					<Group gap='xs' align='center'>
						<Text size='lg' fw={600}>
							{courseName || 'Course'}
						</Text>
						{courseState && (
							<Badge size='sm' variant='light'>
								{formatCourseState(courseState)}
							</Badge>
						)}
					</Group>
					{courseSection && (
						<Text size='sm' c='dimmed'>
							Section {courseSection}
						</Text>
					)}
				</Stack>
			</Group>
			{courseLink && (
				<Button
					component='a'
					href={courseLink}
					target='_blank'
					rel='noreferrer'
					variant='light'
					size='sm'
				>
					Open in Classroom
				</Button>
			)}
		</Group>
	);
}

function formatCourseState(state: string | null | undefined) {
	if (!state) return '';
	return state
		.toLowerCase()
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}
