'use client';
import { Box, Card, Text } from '@mantine/core';
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
			padding={0}
			radius='md'
			component={Link}
			withBorder
			href={`/courses/${course.id}`}
			style={{
				overflow: 'hidden',
				transition: 'transform 0.2s ease, box-shadow 0.2s ease',
				cursor: 'pointer',
			}}
			styles={{
				root: {
					'&:hover': {
						transform: 'translateY(-4px)',
						boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
					},
				},
			}}
		>
			<Card.Section>
				<Box
					h={180}
					p='xl'
					style={{
						background: gradient,
						position: 'relative',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
					}}
				>
					<Box
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							background:
								'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.4) 100%)',
							pointerEvents: 'none',
						}}
					/>
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
									rgba(255, 255, 255, 0.03) 10px,
									rgba(255, 255, 255, 0.03) 20px
								)
							`,
							pointerEvents: 'none',
						}}
					/>
					<Box style={{ position: 'relative', zIndex: 1 }}>
						<Text
							size='xl'
							fw={600}
							c='white'
							style={{
								textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
								lineHeight: 1.3,
							}}
							lineClamp={2}
						>
							{course.name}
						</Text>
					</Box>
					{course.section && (
						<Box style={{ position: 'relative', zIndex: 1 }}>
							<Text
								size='sm'
								fw={500}
								c='white'
								style={{
									textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
								}}
							>
								{course.section}
							</Text>
						</Box>
					)}
				</Box>
			</Card.Section>
			{course.description && (
				<Box p='md'>
					<Text size='sm' c='dimmed' lineClamp={2}>
						{course.description}
					</Text>
				</Box>
			)}
		</Card>
	);
}
