'use client';

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
	IconClipboardList,
	IconExternalLink,
} from '@tabler/icons-react';
import Link from '@/shared/ui/Link';
import type { MoodleAssignment } from '../../types';
import AssignmentStatus from './AssignmentStatus';

type Props = {
	assignment: MoodleAssignment;
	courseName: string;
	courseId: number;
};

export default function AssignmentHeader({
	assignment,
	courseName,
	courseId,
}: Props) {
	return (
		<Stack>
			<Link c='gray' href={`/lms/courses/${courseId}?tab=assignments`}>
				<Group align='center'>
					<ThemeIcon radius='xl' variant='light' color='gray'>
						<IconArrowNarrowLeft size='1.2rem' />
					</ThemeIcon>
					<Text size='sm'>Back to {courseName}</Text>
				</Group>
			</Link>
			<Paper p='xl' withBorder>
				<Flex align='start' gap='md' justify='space-between'>
					<Flex align='center' gap='md'>
						<ThemeIcon size={60} variant='light' color='gray'>
							<IconClipboardList size='1.5rem' />
						</ThemeIcon>
						<Stack gap={1}>
							<Group gap='xs'>
								<Badge size='sm' variant='default' radius={'xs'}>
									{courseName}
								</Badge>
								<AssignmentStatus
									assignment={assignment}
									radius='xs'
									variant='light'
								/>
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
