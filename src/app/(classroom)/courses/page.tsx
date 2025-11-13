import { Container, SimpleGrid } from '@mantine/core';
import googleClassroom from '@/lib/googleClassroom';
import CourseItem from './CourseItem';

export default async function CoursesPage() {
	const classroom = await googleClassroom();
	const courses = await classroom.courses.list();

	return (
		<Container mt='lg' size='xl'>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 4 }}>
				{courses.data.courses?.map((course) => (
					<CourseItem key={course.id} course={course} />
				))}
			</SimpleGrid>
		</Container>
	);
}
