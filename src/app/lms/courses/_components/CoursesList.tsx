'use client';

import {
	Anchor,
	Box,
	Card,
	CardSection,
	Container,
	Divider,
	Flex,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getUserCourses } from '../_server/actions';
import CourseItem from './CourseItem';
import CreateCourseModal from './CreateCourseModal';
import FiveDaysLogo from '@/shared/ui/FiveDaysLogo';

export default function CoursesList() {
	const { data: courses, isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getUserCourses,
	});

	return (
		<Container mt='lg' size='xl'>
			<Flex justify='space-between' align='center' mb='md'>
				<FiveDaysLogo size='1.8rem' fw={500} />
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
		<Container ta='center' py='xl' size={'sm'}>
			<Stack gap='sm' align='center'>
				<Text c='dimmed'>
					<FiveDaysLogo fw={500} inline /> is a Learning Management System
					powered by Moodle. Click the "New Course" button above to create
					your first course.
				</Text>
				<Anchor
					href={process.env.NEXT_PUBLIC_MOODLE_URL}
					target='_blank'
					size='sm'
				>
					Click here to view the Moodle instance
				</Anchor>
				<Group gap='xs' mt={'lg'}>
					<Text size='xs' c='dimmed'>
						View source code on
					</Text>
					<Anchor
						href='https://github.com/ntholi/registry-web'
						target='_blank'
						c='dimmed'
						size='xs'
					>
						<Group gap={4}>
							<IconBrandGithub size={14} />
							GitHub
						</Group>
					</Anchor>
				</Group>
			</Stack>
		</Container>
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
