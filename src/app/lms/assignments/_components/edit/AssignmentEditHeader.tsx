'use client';

import type { MoodleCourse } from '@lms/courses';
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
import type { MoodleAssignment } from '../../types';

type Props = {
	assignment: MoodleAssignment;
	course: MoodleCourse;
};

export default function AssignmentEditHeader({ assignment, course }: Props) {
	return (
		<Stack>
			<Link
				c='gray'
				href={`/lms/courses/${course.id}/assignments/${assignment.id}`}
			>
				<Group align='center'>
					<ThemeIcon radius='xl' variant='light' color='gray'>
						<IconArrowNarrowLeft size='1.2rem' />
					</ThemeIcon>
					<Text size='sm'>Back to {assignment.name}</Text>
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
							<Title order={2}>{assignment.name}</Title>
						</Stack>
					</Flex>
					{assignment.cmid && (
						<Button
							component='a'
							href={`${process.env.NEXT_PUBLIC_MOODLE_URL}/mod/assign/view.php?id=${assignment.cmid}`}
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
