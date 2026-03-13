import { getUserCourses } from '@lms/courses';
import { getQuiz, QuizHeader, QuizTabs } from '@lms/quizzes';
import { Container } from '@mantine/core';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/core/platform/withPermission';

type Props = {
	params: Promise<{ id: string; quizId: string }>;
};

export default async function QuizPage({ params }: Props) {
	const { id, quizId } = await params;
	const session = await getSession();

	if (!session?.user?.id) {
		redirect(
			`/auth/login?callbackUrl=${encodeURIComponent(`/lms/courses/${id}/quizzes/${quizId}`)}`
		);
	}

	const courses = await getUserCourses();
	const course = courses.find((entry) => String(entry.id) === id);

	if (!course) {
		redirect('/lms/courses');
	}

	const quiz = await getQuiz(Number(quizId));

	if (!quiz) {
		notFound();
	}

	return (
		<Container size='xl'>
			<QuizHeader
				quiz={quiz}
				courseName={course.fullname}
				courseId={course.id}
			/>
			<QuizTabs quiz={quiz} courseId={course.id} />
		</Container>
	);
}
