import {
	AssignmentEditForm,
	AssignmentEditHeader,
	getAssignment,
} from '@lms/assignments';
import { getUserCourses } from '@lms/courses';
import { Container } from '@mantine/core';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/core/platform/withPermission';

type Props = {
	params: Promise<{ id: string; assignmentId: string }>;
};

export default async function AssignmentEditPage({ params }: Props) {
	const { id, assignmentId } = await params;
	const session = await getSession();

	if (!session?.user?.id) {
		redirect(
			`/auth/login?callbackUrl=${encodeURIComponent(`/lms/courses/${id}/assignments/${assignmentId}/edit`)}`
		);
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
			<AssignmentEditHeader assignment={assignment} course={course} />
			<AssignmentEditForm assignment={assignment} courseId={course.id} />
		</Container>
	);
}
