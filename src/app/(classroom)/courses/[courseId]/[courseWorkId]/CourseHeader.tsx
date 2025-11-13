'use client';

import { ActionIcon, Box, Group, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

type Props = {
	courseId: string;
	courseName: string | null | undefined;
	courseSection: string | null | undefined;
};

export default function CourseHeader({
	courseId,
	courseName,
	courseSection,
}: Props) {
	return (
		<Box>
			<Group gap='xs' mb='sm'>
				<ActionIcon
					component={Link}
					href={`/courses/${courseId}`}
					variant='subtle'
					size='lg'
				>
					<IconArrowLeft size='1.25rem' />
				</ActionIcon>
				<Box>
					<Text size='sm' c='dimmed' lineClamp={1}>
						{courseName}
						{courseSection && ` • ${courseSection}`}
					</Text>
				</Box>
			</Group>
		</Box>
	);
}
