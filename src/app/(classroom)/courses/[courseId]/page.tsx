import { Container, Tabs } from '@mantine/core';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasGoogleClassroomScope } from '@/lib/googleClassroom';
import {
	getCourse,
	getCourseAnnouncements,
	getCourseTopics,
	getCourseWork,
} from '@/server/classroom/actions';
import AssessmentsTab from './AssessmentsTab';
import DashboardTab from './DashboardTab';
import MaterialTab from './MaterialTab';

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

	const [_course, announcements, courseWork, topics] = await Promise.all([
		getCourse(courseId),
		getCourseAnnouncements(courseId),
		getCourseWork(courseId),
		getCourseTopics(courseId),
	]);

	const assessments = courseWork.filter(
		(work) =>
			work.workType === 'ASSIGNMENT' ||
			work.workType === 'SHORT_ANSWER_QUESTION' ||
			work.workType === 'MULTIPLE_CHOICE_QUESTION'
	);

	const materials = courseWork.filter((work) => work.workType === 'MATERIAL');

	return (
		<Container size='xl' mt='lg'>
			<Tabs defaultValue='dashboard' variant='outline'>
				<Tabs.List mb='lg'>
					<Tabs.Tab value='dashboard'>Dashboard</Tabs.Tab>
					<Tabs.Tab value='assessments'>Assessments</Tabs.Tab>
					<Tabs.Tab value='material'>Material</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value='dashboard'>
					<DashboardTab announcements={announcements} />
				</Tabs.Panel>

				<Tabs.Panel value='assessments'>
					<AssessmentsTab
						assessments={assessments}
						topics={topics}
						courseId={courseId}
					/>
				</Tabs.Panel>

				<Tabs.Panel value='material'>
					<MaterialTab
						materials={materials}
						topics={topics}
						courseId={courseId}
					/>
				</Tabs.Panel>
			</Tabs>
		</Container>
	);
}
