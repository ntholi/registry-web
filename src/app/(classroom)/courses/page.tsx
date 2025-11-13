import { Container, SimpleGrid } from '@mantine/core';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';
import googleClassroom, {
	hasGoogleClassroomScope,
} from '@/core/integrations/google-classroom';
import CourseItem from '@/modules/classroom/features/courses/components/CourseItem';

export default async function CoursesPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/api/auth/signin');
	}

	const hasScope = await hasGoogleClassroomScope(session.user.id);

	if (!hasScope) {
		redirect('/api/auth/google-classroom?state=/courses');
	}

	const classroom = await googleClassroom();
	const courses = await classroom.courses.list({ courseStates: ['ACTIVE'] });

	return (
		<Container mt='lg' size='xl'>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
				{courses.data.courses?.map((course) => (
					<CourseItem key={course.id} course={course} />
				))}
			</SimpleGrid>
		</Container>
	);
}
