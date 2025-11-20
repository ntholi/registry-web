import {
	AssessmentsTabWrapper,
	CourseDetailHeader,
	DashboardTabWrapper,
	getCourse,
	MaterialTabWrapper,
} from '@classroom/courses';
import {
	Container,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
} from '@mantine/core';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';
import { hasGoogleClassroomScope } from '@/core/integrations/google-classroom';

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

	return (
		<Container size='xl' py='xl'>
			<Stack gap='xl'>
				<CourseDetailHeader course={course} />

				<Tabs defaultValue='dashboard' variant='pills' keepMounted={false}>
					<TabsList style={{ borderBottom: 'none' }}>
						<TabsTab value='dashboard'>Dashboard</TabsTab>
						<TabsTab value='assessments'>Assessments</TabsTab>
						<TabsTab value='material'>Material</TabsTab>
					</TabsList>

					<TabsPanel value='dashboard' pt='xl'>
						<DashboardTabWrapper courseId={courseId} />
					</TabsPanel>

					<TabsPanel value='assessments' pt='xl'>
						<AssessmentsTabWrapper courseId={courseId} />
					</TabsPanel>

					<TabsPanel value='material' pt='xl'>
						<MaterialTabWrapper courseId={courseId} />
					</TabsPanel>
				</Tabs>
			</Stack>
		</Container>
	);
}
