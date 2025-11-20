import {
	AssessmentsTabWrapper,
	DashboardTabWrapper,
	getCourse,
	MaterialTabWrapper,
} from '@classroom/courses';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';
import { hasGoogleClassroomScope } from '@/core/integrations/google-classroom';
import CoursePageClient from './CoursePageClient';

type Props = {
	params: Promise<{
		courseId: string;
	}>;
};

export default async function CoursePage({ params }: Props) {
	const { courseId } = await params;

	const session = await auth();

	if (!session?.user?.id) {
		redirect('/api/auth/signin');
	}

	const hasScope = await hasGoogleClassroomScope(session.user.id);

	if (!hasScope) {
		redirect(`/api/auth/google-classroom?state=/courses/${courseId}`);
	}

	const course = await getCourse(courseId);

	if (!course) {
		redirect('/courses');
	}

	return <CoursePageClient course={course} courseId={courseId} />;
}
