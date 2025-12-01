'use client';

import {
	Anchor,
	Box,
	Card,
	CardSection,
	Container,
	Divider,
	Flex,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getUserCourses } from '../server/actions';
import CourseItem from './CourseItem';
import CreateCourseModal from './CreateCourseModal';

export default function CoursesList() {
	const { data: courses, isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getUserCourses,
	});

	return (
		<Container mt='lg' size='xl'>
			<Flex justify='space-between' align='center' mb='md'>
				<Text size='1.8rem' fw={500}>
					<Text component='span' fw={500} c='blue'>
						Five
					</Text>
					Days
				</Text>
				<CreateCourseModal />
			</Flex>

			<Divider mb='xl' />

			{isLoading ? (
				<CoursesLoadingSkeleton />
			) : courses && courses.length > 0 ? (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
					{courses.map((course) => (
						<CourseItem key={course.id} course={course} />
					))}
				</SimpleGrid>
			) : (
				<EmptyState />
			)}
		</Container>
	);
}

function EmptyState() {
	return (
		<Box ta='center' py='xl'>
			<Text size='sm' c='dimmed'>
				<Text component='span' fw={500} mb='md'>
					<Text component='span' c='blue'>
						Five
					</Text>
					Days
				</Text>{' '}
				is a learning management system powered by Moodle. Click the "New
				Course" button above to create your first course.
			</Text>
			<Anchor
				href='https://github.com/ntholi/registry-web'
				target='_blank'
				size='sm'
				c={'dimmed'}
			>
				View source code
			</Anchor>
		</Box>
	);
}

function CoursesLoadingSkeleton() {
	return (
		<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
			{[1, 2, 3, 4, 5, 6].map((i) => (
				<Card
					key={i}
					shadow='lg'
					padding='lg'
					radius='sm'
					withBorder
					style={{ overflow: 'hidden' }}
				>
					<CardSection
						style={{
							height: '8.5rem',
							position: 'relative',
							overflow: 'hidden',
						}}
					>
						<Skeleton height='100%' radius={6} />
						<Box
							style={{
								position: 'absolute',
								zIndex: 2,
								inset: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '0 2rem',
							}}
						>
							<Box
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Skeleton height={72} width={72} radius='xl' />
							</Box>
							<Box />
						</Box>
					</CardSection>
					<Stack gap='sm' mt='md'>
						<Flex justify='space-between' align='baseline'>
							<Skeleton height={22} width='65%' radius='sm' />
							<Skeleton height={20} width={80} radius='sm' />
						</Flex>
					</Stack>
				</Card>
			))}
		</SimpleGrid>
	);
}
