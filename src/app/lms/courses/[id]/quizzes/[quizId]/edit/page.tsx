import { getUserCourses } from '@lms/courses';
import { getQuiz, QuizEditForm, QuizEditHeader } from '@lms/quizzes';
import { Container } from '@mantine/core';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/core/auth';

type Props = {
	params: Promise<{ id: string; quizId: string }>;
};

export default async function QuizEditPage({ params }: Props) {
	const { id, quizId } = await params;
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/api/auth/signin');
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
			<QuizEditHeader quiz={quiz} course={course} />
			<QuizEditForm quiz={quiz} courseId={course.id} />
		</Container>
	);
}
