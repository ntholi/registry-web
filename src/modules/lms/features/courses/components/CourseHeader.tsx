'use client';

import {
	Badge,
	Flex,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconArrowNarrowLeft, IconBook2 } from '@tabler/icons-react';
import Link from '@/shared/ui/Link';

type Props = {
	fullname: string;
	shortname: string;
	categoryName?: string;
};

export default function CourseHeader({
	fullname,
	shortname,
	categoryName,
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
				<Flex align='center' gap='md'>
					<ThemeIcon size={60} variant='light' color='gray'>
						<IconBook2 size={'1.5rem'} />
					</ThemeIcon>
					<Stack gap={1}>
						<Group gap={'xs'}>
							<Badge radius={'xs'} variant='light' color='blue'>
								{shortname}
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
			</Paper>
		</Stack>
	);
}
