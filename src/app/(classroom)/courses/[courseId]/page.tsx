import { AssessmentsTab, DashboardTab, MaterialTab } from '@classroom/courses';
import {
	getCourse,
	getCourseAnnouncements,
	getCourseTopics,
	getCourseWork,
} from '@classroom/courses/server';
import {
	Badge,
	Button,
	Container,
	Group,
	Paper,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
	Title,
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

	const [course, announcements, courseWork, topics] = await Promise.all([
		getCourse(courseId),
		getCourseAnnouncements(courseId),
		getCourseWork(courseId),
		getCourseTopics(courseId),
	]);

	if (!course) {
		redirect('/courses');
	}

	const assessments = courseWork.filter(
		(work) =>
			work.workType === 'ASSIGNMENT' ||
			work.workType === 'SHORT_ANSWER_QUESTION' ||
			work.workType === 'MULTIPLE_CHOICE_QUESTION'
	);

	const materials = courseWork.filter((work) => work.workType === 'MATERIAL');

	const stateLabel = formatCourseState(course.courseState);
	const metadataBadges = [
		course.section ? `Section ${course.section}` : null,
		course.room ? `Room ${course.room}` : null,
		course.enrollmentCode ? `Code ${course.enrollmentCode}` : null,
	].filter(Boolean) as string[];
	const updatedLabel = formatUpdatedTime(course.updateTime);

	return (
		<Container size='xl' py='xl'>
			<Stack gap='xl'>
				<Paper withBorder radius='lg' p={{ base: 'lg', md: 'xl' }}>
					<Stack gap='md'>
						<Group justify='space-between' align='flex-start'>
							<Stack gap='xs'>
								<Title order={1} size='h2'>
									{course.name}
								</Title>
								{course.descriptionHeading && (
									<Text size='sm' c='dimmed'>
										{course.descriptionHeading}
									</Text>
								)}
								{metadataBadges.length > 0 && (
									<Group gap='xs'>
										{metadataBadges.map((item) => (
											<Badge key={item} variant='outline' size='md'>
												{item}
											</Badge>
										))}
									</Group>
								)}
								{updatedLabel && (
									<Text size='xs' c='dimmed'>
										Updated {updatedLabel}
									</Text>
								)}
							</Stack>
							<Group gap='sm'>
								{stateLabel && (
									<Badge size='lg' variant='light'>
										{stateLabel}
									</Badge>
								)}
								{course.alternateLink && (
									<Button
										component='a'
										href={course.alternateLink}
										target='_blank'
										rel='noreferrer'
										variant='light'
										size='sm'
									>
										Open in Classroom
									</Button>
								)}
							</Group>
						</Group>
					</Stack>
				</Paper>

				<Tabs
					defaultValue='dashboard'
					variant='pills'
					radius='lg'
					keepMounted={false}
				>
					<TabsList mb='lg' style={{ gap: '0.5rem' }}>
						<TabsTab value='dashboard'>Dashboard</TabsTab>
						<TabsTab value='assessments'>Assessments</TabsTab>
						<TabsTab value='material'>Material</TabsTab>
					</TabsList>

					<TabsPanel value='dashboard'>
						<DashboardTab announcements={announcements} />
					</TabsPanel>

					<TabsPanel value='assessments'>
						<AssessmentsTab
							assessments={assessments}
							topics={topics}
							courseId={courseId}
						/>
					</TabsPanel>

					<TabsPanel value='material'>
						<MaterialTab
							materials={materials}
							topics={topics}
							courseId={courseId}
						/>
					</TabsPanel>
				</Tabs>
			</Stack>
		</Container>
	);
}

function formatCourseState(state: string | null | undefined) {
	if (!state) return '';
	return state
		.toLowerCase()
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function formatUpdatedTime(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}
