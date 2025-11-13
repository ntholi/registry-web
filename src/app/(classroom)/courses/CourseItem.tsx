'use client';
import { Box, Card, Flex, Text } from '@mantine/core';
import type { classroom_v1 } from 'googleapis';
import Link from 'next/link';

type Props = {
	course: classroom_v1.Schema$Course;
};

function getCourseGradient(courseId?: string | null): string {
	const gradients = [
		'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
		'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
		'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
		'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
		'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
		'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
		'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
		'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
		'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
		'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
		'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
		'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
	];

	if (!courseId) {
		return gradients[0];
	}

	const hash = courseId.split('').reduce((acc, char) => {
		return char.charCodeAt(0) + ((acc << 5) - acc);
	}, 0);

	const index = Math.abs(hash) % gradients.length;
	return gradients[index];
}

export default function CourseItem({ course }: Props) {
	const gradient = getCourseGradient(course.id);

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
				<Box
					h={120}
					style={{
						background: gradient,
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					<Box
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundImage: `
								repeating-linear-gradient(
									45deg,
									transparent,
									transparent 10px,
									rgba(255, 255, 255, 0.05) 10px,
									rgba(255, 255, 255, 0.05) 20px
								)
							`,
						}}
					/>
				</Box>
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
