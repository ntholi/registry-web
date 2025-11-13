'use client';

import { ActionIcon, Breadcrumbs, Text } from '@mantine/core';
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
		<Breadcrumbs>
			<ActionIcon
				component={Link}
				href={`/courses/${courseId}`}
				variant='subtle'
				size='lg'
			>
				<IconArrowLeft size='1.25rem' />
			</ActionIcon>
			<Text size='sm' c='dimmed'>
				{courseName}
				{courseSection && ` • ${courseSection}`}
			</Text>
		</Breadcrumbs>
	);
}
