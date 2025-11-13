'use client';
import { Card, Flex, Image, Text } from '@mantine/core';
import type { classroom_v1 } from 'googleapis';
import Link from 'next/link';

type Props = {
	course: classroom_v1.Schema$Course;
};

export default function CourseItem({ course }: Props) {
	return (
		<Card
			shadow='sm'
			padding='lg'
			radius='sm'
			component={Link}
			withBorder
			href={`/courses/${course.id}`}
		>
			<Card.Section>
				<Image
					src={`https://picsum.photos/seed/${course.id}/800/160`}
					h={160}
					alt={course.name ?? 'Course image'}
				/>
			</Card.Section>
			<Text fw={500} mt='lg' size='lg'>
				{course.name}
			</Text>
			<Flex mt='sm' justify='space-between'>
				<Text mt='xs' c='dimmed' size='sm'>
					{course.description}
				</Text>
				<Text mt='xs' c='dimmed' size='sm'>
					{course.section}
				</Text>
			</Flex>
		</Card>
	);
}
