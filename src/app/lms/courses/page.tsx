import { CourseItem, CreateCourseModal, getUserCourses } from '@lms/courses';
import { Container, Divider, Flex, SimpleGrid, Text } from '@mantine/core';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';

export default async function CoursesPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/api/auth/signin');
	}

	const courses = await getUserCourses();

	return (
		<Container mt='lg' size='xl'>
			<Flex justify='space-between' align='center' mb='md'>
				<Text size='1.7rem'>
					<Text component='span' c='blue'>
						Five
					</Text>
					Days
				</Text>
				<CreateCourseModal />
			</Flex>

			<Divider mb='xl' />

			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
				{courses?.map((course) => (
					<CourseItem key={course.id} course={course} />
				))}
			</SimpleGrid>
		</Container>
	);
}
