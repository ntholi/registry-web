import {
	CourseHeader,
	CourseTabs,
	getMoodleCategories,
	getUserCourses,
} from '@lms/courses';
import { Container } from '@mantine/core';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CoursePage({ params }: Props) {
	const { id } = await params;
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/api/auth/signin');
	}

	const [courses, categories] = await Promise.all([
		getUserCourses(),
		getMoodleCategories(),
	]);

	const course = courses.find((entry) => String(entry.id) === id);

	if (!course) {
		redirect('/lms/courses');
	}

	const category = categories.find((c) => c.id === course.category);

	return (
		<Container size='xl'>
			<CourseHeader
				fullname={course.fullname}
				shortname={course.shortname}
				categoryName={category?.name}
				courseId={course.id}
			/>
			<CourseTabs course={course} />
		</Container>
	);
}
