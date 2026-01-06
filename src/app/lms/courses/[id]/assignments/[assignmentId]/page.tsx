import {
	AssignmentHeader,
	AssignmentTabs,
	getAssignment,
} from '@lms/assignments';
import { getUserCourses } from '@lms/courses';
import { Container } from '@mantine/core';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/core/auth';

type Props = {
	params: Promise<{ id: string; assignmentId: string }>;
};

export default async function AssignmentPage({ params }: Props) {
	const { id, assignmentId } = await params;
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/api/auth/signin');
	}

	const courses = await getUserCourses();
	const course = courses.find((entry) => String(entry.id) === id);

	if (!course) {
		redirect('/lms/courses');
	}

	const assignment = await getAssignment(course.id, Number(assignmentId));

	if (!assignment) {
		notFound();
	}

	return (
		<Container size='xl'>
			<AssignmentHeader
				assignment={assignment}
				courseName={course.fullname}
				courseId={course.id}
			/>
			<AssignmentTabs assignment={assignment} courseId={course.id} />
		</Container>
	);
}
