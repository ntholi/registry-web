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
import type { MoodleAssignment } from '../types';

type Props = {
	assignment: MoodleAssignment;
	courseName: string;
	courseId: number;
};

export default function AssessmentHeader({
	assignment,
	courseName,
	courseId,
}: Props) {
	const dueDate = assignment.duedate
		? new Date(assignment.duedate * 1000)
		: null;
	const now = new Date();
	const isOverdue = dueDate && dueDate < now;
	const availableFrom = assignment.allowsubmissionsfromdate
		? new Date(assignment.allowsubmissionsfromdate * 1000)
		: null;
	const isUpcoming = availableFrom && availableFrom > now;

	function getStatusBadge() {
		if (isOverdue) {
			return (
				<Badge radius='xs' variant='light' color='red'>
					Overdue
				</Badge>
			);
		}
		if (isUpcoming) {
			return (
				<Badge radius='xs' variant='light' color='teal'>
					Upcoming
				</Badge>
			);
		}
		return (
			<Badge radius='xs' variant='light' color='green'>
				Active
			</Badge>
		);
	}

	return (
		<Stack>
			<Link c='gray' href={`/lms/courses/${courseId}`}>
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
						<ThemeIcon size={60} variant='light' color='blue'>
							<IconClipboardList size='1.5rem' />
						</ThemeIcon>
						<Stack gap={1}>
							<Group gap='xs'>
								<Badge size='sm' variant='default' radius={'sm'}>
									{courseName}
								</Badge>
								{getStatusBadge()}
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
