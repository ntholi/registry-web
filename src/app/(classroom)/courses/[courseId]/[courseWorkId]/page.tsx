import {
	Badge,
	Box,
	Card,
	Container,
	Divider,
	Group,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasGoogleClassroomScope } from '@/lib/googleClassroom';
import {
	getCourseWorkById,
	getCourseWorkSubmissions,
} from '@/server/classroom/actions';

type Props = {
	params: Promise<{
		courseId: string;
		courseWorkId: string;
	}>;
};

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return 'No date';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function getWorkTypeLabel(workType: string | null | undefined) {
	switch (workType) {
		case 'ASSIGNMENT':
			return 'Assignment';
		case 'SHORT_ANSWER_QUESTION':
			return 'Question';
		case 'MULTIPLE_CHOICE_QUESTION':
			return 'Quiz';
		case 'MATERIAL':
			return 'Material';
		default:
			return 'Work';
	}
}

function getStateLabel(state: string | null | undefined) {
	switch (state) {
		case 'NEW':
			return 'Assigned';
		case 'CREATED':
			return 'Created';
		case 'TURNED_IN':
			return 'Turned in';
		case 'RETURNED':
			return 'Graded';
		case 'RECLAIMED_BY_STUDENT':
			return 'Reclaimed';
		default:
			return state || 'Unknown';
	}
}

export default async function CourseWorkPage({ params }: Props) {
	const { courseId, courseWorkId } = await params;

	const session = await auth();

	if (!session?.user?.id) {
		redirect('/api/auth/signin');
	}

	const hasScope = await hasGoogleClassroomScope(session.user.id);

	if (!hasScope) {
		redirect(
			`/api/auth/google-classroom?state=/courses/${courseId}/${courseWorkId}`
		);
	}

	const [courseWork, submissions] = await Promise.all([
		getCourseWorkById(courseId, courseWorkId),
		getCourseWorkSubmissions(courseId, courseWorkId),
	]);

	if (!courseWork) {
		redirect(`/courses/${courseId}`);
	}

	return (
		<Container size='xl' mt='lg'>
			<Stack gap='lg'>
				<Card shadow='sm' padding='lg' radius='md'>
					<Stack gap='md'>
						<Group justify='space-between'>
							<Badge size='lg' variant='light'>
								{getWorkTypeLabel(courseWork.workType)}
							</Badge>
							{courseWork.maxPoints && (
								<Text size='xl' fw={700} c='blue'>
									{courseWork.maxPoints} points
								</Text>
							)}
						</Group>

						<Title order={2}>{courseWork.title}</Title>

						{courseWork.description && (
							<Box>
								<Text
									size='md'
									style={{ whiteSpace: 'pre-wrap' }}
									dangerouslySetInnerHTML={{ __html: courseWork.description }}
								/>
							</Box>
						)}

						<Divider />

						<Group>
							{courseWork.dueDate && (
								<Box>
									<Text size='sm' c='dimmed'>
										Due date
									</Text>
									<Text size='sm' fw={500}>
										{formatDate(
											new Date(
												courseWork.dueDate.year || 0,
												(courseWork.dueDate.month || 1) - 1,
												courseWork.dueDate.day || 1,
												courseWork.dueTime?.hours || 23,
												courseWork.dueTime?.minutes || 59
											).toISOString()
										)}
									</Text>
								</Box>
							)}
							<Box>
								<Text size='sm' c='dimmed'>
									Created
								</Text>
								<Text size='sm' fw={500}>
									{formatDate(courseWork.creationTime)}
								</Text>
							</Box>
						</Group>

						{courseWork.materials && courseWork.materials.length > 0 && (
							<Box>
								<Text size='sm' fw={500} mb='xs'>
									Attachments
								</Text>
								<Stack gap='xs'>
									{courseWork.materials.map((material, index) => (
										<Card
											key={
												material.driveFile?.driveFile?.id ||
												material.link?.url ||
												material.youtubeVideo?.id ||
												material.form?.formUrl ||
												index
											}
											withBorder
											padding='sm'
										>
											<Group justify='space-between'>
												<Text size='sm'>
													{material.driveFile?.driveFile?.title ||
														material.link?.title ||
														material.youtubeVideo?.title ||
														material.form?.title ||
														'Attachment'}
												</Text>
												{material.link?.url && (
													<Text
														size='xs'
														component='a'
														href={material.link.url}
														target='_blank'
														c='blue'
													>
														Open
													</Text>
												)}
											</Group>
										</Card>
									))}
								</Stack>
							</Box>
						)}
					</Stack>
				</Card>

				{courseWork.workType !== 'MATERIAL' && submissions.length > 0 && (
					<Card shadow='sm' padding='lg' radius='md'>
						<Stack gap='md'>
							<Group justify='space-between'>
								<Title order={3}>Submissions</Title>
								<Badge size='lg' variant='light'>
									{submissions.length} students
								</Badge>
							</Group>

							<Stack gap='xs'>
								{submissions.map((submission) => (
									<Card key={submission.id} withBorder padding='md'>
										<Group justify='space-between'>
											<Box>
												<Text size='sm' fw={500}>
													{submission.userId}
												</Text>
												<Badge size='sm' variant='dot' mt='xs'>
													{getStateLabel(submission.state)}
												</Badge>
											</Box>
											<Box style={{ textAlign: 'right' }}>
												{submission.assignedGrade !== null &&
													submission.assignedGrade !== undefined && (
														<Text size='lg' fw={700} c='blue'>
															{submission.assignedGrade} /{' '}
															{courseWork.maxPoints}
														</Text>
													)}
												{submission.late && (
													<Badge size='xs' color='red' mt='xs'>
														Late
													</Badge>
												)}
											</Box>
										</Group>
									</Card>
								))}
							</Stack>
						</Stack>
					</Card>
				)}
			</Stack>
		</Container>
	);
}
