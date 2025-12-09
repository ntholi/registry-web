import { getAssignment, getAssignmentSubmissions } from '@lms/assignments';
import { SubmissionViewer } from '@lms/assignments/components/submission/viewer';
import { getUserCourses } from '@lms/courses';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/core/auth';

type Props = {
	params: Promise<{ id: string; assignmentId: string; submissionId: string }>;
	searchParams: Promise<{ fileIndex?: string }>;
};

export default async function SubmissionViewerPage({
	params,
	searchParams,
}: Props) {
	const { id, assignmentId, submissionId } = await params;
	const { fileIndex } = await searchParams;
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

	const users = await getAssignmentSubmissions(assignment.id, course.id);
	const userId = Number(submissionId);
	const currentUserIndex = users.findIndex((u) => u.id === userId);

	if (currentUserIndex === -1) {
		notFound();
	}

	const currentUser = users[currentUserIndex];
	const initialFileIndex = fileIndex ? Number(fileIndex) : 0;

	return (
		<SubmissionViewer
			assignment={assignment}
			course={{ id: course.id, name: course.fullname }}
			users={users}
			currentUser={currentUser}
			initialFileIndex={initialFileIndex}
		/>
	);
}
