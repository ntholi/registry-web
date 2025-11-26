'use client';

import {
	Badge,
	Flex,
	Group,
	Paper,
	Stack,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconBook2 } from '@tabler/icons-react';

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
	);
}
