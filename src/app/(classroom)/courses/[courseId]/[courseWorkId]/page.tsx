import {
	Badge,
	Box,
	Container,
	Divider,
	Grid,
	GridCol,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasGoogleClassroomScope } from '@/lib/googleClassroom';
import {
	getCourse,
	getCourseWorkById,
	getCourseWorkSubmissions,
} from '@/server/classroom/actions';
import AttachmentCard from './AttachmentCard';
import CourseHeader from './CourseHeader';
import SubmissionCard from './SubmissionCard';

type Props = {
	params: Promise<{
		courseId: string;
		courseWorkId: string;
	}>;
};

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
}

function formatDateTime(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
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

function getWorkTypeColor(workType: string | null | undefined) {
	switch (workType) {
		case 'ASSIGNMENT':
			return 'blue';
		case 'SHORT_ANSWER_QUESTION':
			return 'green';
		case 'MULTIPLE_CHOICE_QUESTION':
			return 'violet';
		case 'MATERIAL':
			return 'orange';
		default:
			return 'gray';
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

	const [course, courseWork, submissions] = await Promise.all([
		getCourse(courseId),
		getCourseWorkById(courseId, courseWorkId),
		getCourseWorkSubmissions(courseId, courseWorkId),
	]);

	if (!courseWork) {
		redirect(`/courses/${courseId}`);
	}

	const turnedInCount = submissions.filter(
		(s) => s.state === 'TURNED_IN' || s.state === 'RETURNED'
	).length;
	const gradedCount = submissions.filter((s) => s.state === 'RETURNED').length;

	return (
		<Container size='xl' py='xl'>
			<Stack gap='xl'>
				<CourseHeader
					courseId={courseId}
					courseName={course?.name}
					courseSection={course?.section}
				/>

				<Grid gutter='lg'>
					<GridCol span={{ base: 12, md: 8 }}>
						<Paper withBorder p='xl' radius='md'>
							<Stack gap='lg'>
								<Box>
									<Group gap='sm' mb='md'>
										<Badge
											size='lg'
											variant='light'
											color={getWorkTypeColor(courseWork.workType)}
										>
											{getWorkTypeLabel(courseWork.workType)}
										</Badge>
										{courseWork.maxPoints && (
											<Badge size='lg' variant='outline'>
												{courseWork.maxPoints} points
											</Badge>
										)}
									</Group>

									<Title order={1} size='h2' mb='md'>
										{courseWork.title}
									</Title>

									{courseWork.description && (
										<Text
											size='md'
											c='dimmed'
											style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
											dangerouslySetInnerHTML={{
												__html: courseWork.description,
											}}
										/>
									)}
								</Box>

								{courseWork.materials && courseWork.materials.length > 0 && (
									<>
										<Divider />
										<Box>
											<Text size='sm' fw={600} mb='md'>
												Attachments
											</Text>
											<Stack gap='xs'>
												{courseWork.materials.map((material, index) => {
													const title =
														material.driveFile?.driveFile?.title ||
														material.link?.title ||
														material.youtubeVideo?.title ||
														material.form?.title ||
														'Attachment';
													const url =
														material.link?.url ||
														material.driveFile?.driveFile?.alternateLink ||
														material.youtubeVideo?.alternateLink ||
														material.form?.formUrl;

													return (
														<AttachmentCard
															key={
																material.driveFile?.driveFile?.id ||
																material.link?.url ||
																material.youtubeVideo?.id ||
																material.form?.formUrl ||
																index
															}
															title={title}
															url={url}
															isFile={!!material.driveFile}
														/>
													);
												})}
											</Stack>
										</Box>
									</>
								)}
							</Stack>
						</Paper>
					</GridCol>

					<GridCol span={{ base: 12, md: 4 }}>
						<Stack gap='md'>
							<Paper withBorder p='lg' radius='md'>
								<Stack gap='lg'>
									<Box>
										<Text size='xs' fw={600} tt='uppercase' c='dimmed' mb='sm'>
											Details
										</Text>
										<Stack gap='md'>
											{courseWork.dueDate && (
												<Box>
													<Text size='sm' fw={500} mb='0.25rem'>
														Due date
													</Text>
													<Text size='sm' c='dimmed'>
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
												<Text size='sm' fw={500} mb='0.25rem'>
													Posted
												</Text>
												<Text size='sm' c='dimmed'>
													{formatDateTime(courseWork.creationTime)}
												</Text>
											</Box>
										</Stack>
									</Box>

									{courseWork.workType !== 'MATERIAL' &&
										submissions.length > 0 && (
											<>
												<Divider />
												<Box>
													<Text
														size='xs'
														fw={600}
														tt='uppercase'
														c='dimmed'
														mb='sm'
													>
														Progress
													</Text>
													<Stack gap='sm'>
														<Group justify='space-between'>
															<Text size='sm'>Total students</Text>
															<Text size='sm' fw={600}>
																{submissions.length}
															</Text>
														</Group>
														<Group justify='space-between'>
															<Text size='sm'>Turned in</Text>
															<Text size='sm' fw={600} c='blue'>
																{turnedInCount}
															</Text>
														</Group>
														<Group justify='space-between'>
															<Text size='sm'>Graded</Text>
															<Text size='sm' fw={600} c='green'>
																{gradedCount}
															</Text>
														</Group>
													</Stack>
												</Box>
											</>
										)}
								</Stack>
							</Paper>
						</Stack>
					</GridCol>
				</Grid>

				{courseWork.workType !== 'MATERIAL' && submissions.length > 0 && (
					<Paper withBorder p='xl' radius='md'>
						<Stack gap='lg'>
							<Group justify='space-between'>
								<Title order={2} size='h4'>
									Student Submissions
								</Title>
								<Badge variant='light' size='lg'>
									{submissions.length}
								</Badge>
							</Group>

							<Stack gap='xs'>
								{submissions.map((submission) => (
									<SubmissionCard
										key={submission.id}
										userId={submission.userId}
										state={submission.state}
										late={submission.late}
										assignedGrade={submission.assignedGrade}
										draftGrade={submission.draftGrade}
										maxPoints={courseWork.maxPoints}
									/>
								))}
							</Stack>
						</Stack>
					</Paper>
				)}
			</Stack>
		</Container>
	);
}
