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
	IconBook2,
	IconExternalLink,
} from '@tabler/icons-react';
import Link from '@/shared/ui/Link';
import { splitShortName } from '../utils';

type Props = {
	fullname: string;
	shortname: string;
	categoryName?: string;
	courseId: number;
};

export default function CourseHeader({
	fullname,
	shortname,
	categoryName,
	courseId,
}: Props) {
	return (
		<Stack>
			<Link c='gray' href='/lms/courses'>
				<Group align='center'>
					<ThemeIcon radius={'xl'} variant='light' color='gray'>
						<IconArrowNarrowLeft size={'1.2rem'} />
					</ThemeIcon>
					<Text size='sm'>Back to Courses</Text>
				</Group>
			</Link>
			<Paper p='xl' withBorder>
				<Flex align='start' gap='md' justify='space-between'>
					<Flex align='center' gap='md'>
						<ThemeIcon size={60} variant='light' color='gray'>
							<IconBook2 size={'1.5rem'} />
						</ThemeIcon>
						<Stack gap={1}>
							<Group gap={'xs'}>
								<Badge radius={'xs'} variant='light' color='blue'>
									{splitShortName(shortname).code}
								</Badge>
								{categoryName && (
									<Badge radius={'xs'} variant='light' color='gray'>
										{categoryName}
									</Badge>
								)}
							</Group>
							<Title order={2}>{fullname}</Title>
						</Stack>
					</Flex>
					<Button
						component='a'
						href={`${process.env.NEXT_PUBLIC_MOODLE_URL}/course/view.php?id=${courseId}`}
						target='_blank'
						rel='noopener noreferrer'
						rightSection={<IconExternalLink size={16} />}
						variant='default'
						size='xs'
					>
						Open in Moodle
					</Button>
				</Flex>
			</Paper>
		</Stack>
	);
}
