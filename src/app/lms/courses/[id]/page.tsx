import { CourseHeader, CourseTabs, getUserCourses } from '@lms/courses';
import { Container } from '@mantine/core';
import { redirect } from 'next/navigation';
import { getSession } from '@/core/platform/withPermission';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CoursePage({ params }: Props) {
	const { id } = await params;
	const session = await getSession();

	if (!session?.user?.id) {
		redirect(
			`/auth/login?callbackUrl=${encodeURIComponent(`/lms/courses/${id}`)}`
		);
	}

	const courses = await getUserCourses();
	const course = courses.find((entry) => String(entry.id) === id);

	if (!course) {
		redirect('/lms/courses');
	}

	return (
		<Container size='xl'>
			<CourseHeader
				fullname={course.fullname}
				shortname={course.shortname}
				courseId={course.id}
			/>
			<CourseTabs course={course} />
		</Container>
	);
}
