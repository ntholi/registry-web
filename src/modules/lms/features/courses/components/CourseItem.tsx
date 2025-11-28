'use client';
import { Badge, Box, Card, Flex, Text } from '@mantine/core';
import Link from 'next/link';
import type { MoodleCourse } from '../types';

type Props = {
	course: MoodleCourse;
};

function getCourseGradient(courseId?: number | null): string {
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

	const gradientIndex = Math.abs(courseId) % gradients.length;
	return gradients[gradientIndex];
}

function getCourseMonogram(name?: string | null): string {
	if (!name) {
		return 'CL';
	}

	const trimmed = name.trim();
	if (trimmed.length === 0) {
		return 'CL';
	}

	const parts = trimmed.split(/\s+/);
	let letters = '';

	for (let index = 0; index < parts.length && index < 2; index += 1) {
		const segment = parts[index];
		if (segment.length > 0) {
			letters += segment[0];
		}
	}

	if (letters.length === 0) {
		return 'CL';
	}

	return letters.toUpperCase();
}

export default function CourseItem({ course }: Props) {
	const gradient = getCourseGradient(course.id);
	const monogram = getCourseMonogram(course.fullname);

	return (
		<Card
			shadow='lg'
			padding='lg'
			radius='sm'
			component={Link}
			withBorder
			href={`/lms/courses/${course.id}`}
			style={{
				overflow: 'hidden',
				transition:
					'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
				cursor: 'pointer',
				textDecoration: 'none',
			}}
			styles={{
				root: {
					'&:hover': {
						transform: 'translateY(-6px)',
						boxShadow: '0 22px 38px rgba(0, 0, 0, 0.22)',
						borderColor: 'rgba(255, 255, 255, 0.18)',
					},
				},
			}}
		>
			<Card.Section
				style={{
					background: gradient,
					height: '8.5rem',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<Box
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(160deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.2) 100%)',
					}}
				/>
				<Box
					style={{
						position: 'absolute',
						top: '-4rem',
						right: '-4rem',
						width: '12rem',
						height: '12rem',
						background: 'rgba(255, 255, 255, 0.12)',
						borderRadius: '999rem',
					}}
				/>
				<Box
					style={{
						position: 'absolute',
						bottom: '-3rem',
						left: '-3rem',
						width: '9rem',
						height: '9rem',
						background: 'rgba(255, 255, 255, 0.08)',
						borderRadius: '999rem',
					}}
				/>
				<Box
					style={{
						position: 'relative',
						zIndex: 1,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						height: '100%',
						padding: '0 2rem',
					}}
				>
					<Box
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '4.5rem',
							height: '4.5rem',
							borderRadius: '1.5rem',
							background: 'rgba(255, 255, 255, 0.22)',
							backdropFilter: 'blur(8px)',
							boxShadow: '0 18px 30px rgba(0, 0, 0, 0.18)',
						}}
					>
						<Text size='xl' fw={700} c='white'>
							{monogram}
						</Text>
					</Box>
				</Box>
			</Card.Section>

			<Flex justify={'space-between'} align={'baseline'} px={'sx'} pt={'md'}>
				<Text size='md' fw={600} lineClamp={2}>
					{course.fullname}
				</Text>
				{course.shortname && (
					<Badge variant='default' radius={'sm'}>
						{course.shortname}
					</Badge>
				)}
			</Flex>
		</Card>
	);
}
