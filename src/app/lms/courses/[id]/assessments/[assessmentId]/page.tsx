import {
	AssessmentHeader,
	AssessmentTabs,
	getAssignment,
} from '@lms/assessment';
import { getUserCourses } from '@lms/courses';
import { Container } from '@mantine/core';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/core/auth';

type Props = {
	params: Promise<{ id: string; assessmentId: string }>;
};

export default async function AssessmentPage({ params }: Props) {
	const { id, assessmentId } = await params;
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/api/auth/signin');
	}

	const courses = await getUserCourses();
	const course = courses.find((entry) => String(entry.id) === id);

	if (!course) {
		redirect('/lms/courses');
	}

	const assignment = await getAssignment(course.id, Number(assessmentId));

	if (!assignment) {
		notFound();
	}

	return (
		<Container size='xl'>
			<AssessmentHeader
				assignment={assignment}
				courseName={course.fullname}
				courseId={course.id}
			/>
			<AssessmentTabs assignment={assignment} />
		</Container>
	);
}
