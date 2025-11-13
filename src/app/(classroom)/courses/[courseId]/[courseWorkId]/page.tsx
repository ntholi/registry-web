import {
	ActionIcon,
	Badge,
	Box,
	Card,
	Container,
	Divider,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import {
	IconArrowLeft,
	IconCalendar,
	IconClock,
	IconFile,
	IconFileText,
	IconLink,
	IconPaperclip,
	IconPointFilled,
	IconUser,
} from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasGoogleClassroomScope } from '@/lib/googleClassroom';
import {
	getCourse,
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
	});
}

function formatDateTime(dateString: string | null | undefined) {
	if (!dateString) return 'No date';
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

function getStateColor(state: string | null | undefined) {
	switch (state) {
		case 'NEW':
			return 'yellow';
		case 'CREATED':
			return 'gray';
		case 'TURNED_IN':
			return 'blue';
		case 'RETURNED':
			return 'green';
		case 'RECLAIMED_BY_STUDENT':
			return 'orange';
		default:
			return 'gray';
	}
}

function getStateLabel(state: string | null | undefined) {
	switch (state) {
		case 'NEW':
			return 'Assigned';
		case 'CREATED':
			return 'Not started';
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
		<Container size='xl' mt='md' mb='xl'>
			<Stack gap='lg'>
				<Box>
					<Group gap='xs' mb='sm'>
						<ActionIcon
							component={Link}
							href={`/courses/${courseId}`}
							variant='subtle'
							size='lg'
						>
							<IconArrowLeft size='1.25rem' />
						</ActionIcon>
						<Box>
							<Text size='sm' c='dimmed' lineClamp={1}>
								{course?.name}
								{course?.section && ` • ${course.section}`}
							</Text>
						</Box>
					</Group>
				</Box>

				<Grid gutter='lg'>
					<Grid.Col span={{ base: 12, md: 8 }}>
						<Stack gap='md'>
							<Paper shadow='xs' p='xl' radius='md'>
								<Stack gap='lg'>
									<Box>
										<Group gap='sm' mb='md'>
											<Badge
												size='lg'
												variant='light'
												color={getWorkTypeColor(courseWork.workType)}
												leftSection={<IconFileText size='0.9rem' />}
											>
												{getWorkTypeLabel(courseWork.workType)}
											</Badge>
											{courseWork.maxPoints && (
												<Badge size='lg' variant='outline' color='blue'>
													{courseWork.maxPoints} points
												</Badge>
											)}
										</Group>

										<Title order={1} size='h2' mb='sm'>
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
												<Group gap='xs' mb='md'>
													<IconPaperclip size='1.125rem' />
													<Text size='sm' fw={600}>
														Attachments
													</Text>
												</Group>
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
															<Card
																key={
																	material.driveFile?.driveFile?.id ||
																	material.link?.url ||
																	material.youtubeVideo?.id ||
																	material.form?.formUrl ||
																	index
																}
																withBorder
																padding='md'
																component={url ? 'a' : 'div'}
																href={url || undefined}
																target='_blank'
																style={{
																	cursor: url ? 'pointer' : 'default',
																	transition: 'all 0.2s',
																}}
																className={url ? 'hover-lift' : ''}
															>
																<Group gap='sm' wrap='nowrap'>
																	<Box
																		style={{
																			color: 'var(--mantine-color-blue-6)',
																		}}
																	>
																		{material.driveFile ? (
																			<IconFile size='1.25rem' />
																		) : (
																			<IconLink size='1.25rem' />
																		)}
																	</Box>
																	<Box style={{ flex: 1, minWidth: 0 }}>
																		<Text
																			size='sm'
																			fw={500}
																			style={{
																				overflow: 'hidden',
																				textOverflow: 'ellipsis',
																				whiteSpace: 'nowrap',
																			}}
																		>
																			{title}
																		</Text>
																		{url && (
																			<Text size='xs' c='dimmed' lineClamp={1}>
																				{url}
																			</Text>
																		)}
																	</Box>
																</Group>
															</Card>
														);
													})}
												</Stack>
											</Box>
										</>
									)}
								</Stack>
							</Paper>
						</Stack>
					</Grid.Col>

					<Grid.Col span={{ base: 12, md: 4 }}>
						<Stack gap='md'>
							<Paper shadow='xs' p='lg' radius='md'>
								<Stack gap='md'>
									<Text size='sm' fw={600} tt='uppercase' c='dimmed'>
										Details
									</Text>

									{courseWork.dueDate && (
										<Box>
											<Group gap='xs' mb='xs'>
												<IconCalendar size='1rem' stroke={1.5} />
												<Text size='sm' fw={500}>
													Due date
												</Text>
											</Group>
											<Text size='sm' c='dimmed' pl='calc(1rem + 0.5rem)'>
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
										<Group gap='xs' mb='xs'>
											<IconClock size='1rem' stroke={1.5} />
											<Text size='sm' fw={500}>
												Posted
											</Text>
										</Group>
										<Text size='sm' c='dimmed' pl='calc(1rem + 0.5rem)'>
											{formatDateTime(courseWork.creationTime)}
										</Text>
									</Box>

									{courseWork.updateTime &&
										courseWork.updateTime !== courseWork.creationTime && (
											<Box>
												<Group gap='xs' mb='xs'>
													<IconClock size='1rem' stroke={1.5} />
													<Text size='sm' fw={500}>
														Last updated
													</Text>
												</Group>
												<Text size='sm' c='dimmed' pl='calc(1rem + 0.5rem)'>
													{formatDateTime(courseWork.updateTime)}
												</Text>
											</Box>
										)}
								</Stack>
							</Paper>

							{courseWork.workType !== 'MATERIAL' && submissions.length > 0 && (
								<Paper shadow='xs' p='lg' radius='md'>
									<Stack gap='md'>
										<Text size='sm' fw={600} tt='uppercase' c='dimmed'>
											Progress
										</Text>

										<Box>
											<Group justify='space-between' mb='xs'>
												<Text size='sm' fw={500}>
													Total students
												</Text>
												<Text size='sm' fw={600}>
													{submissions.length}
												</Text>
											</Group>
											<Group justify='space-between' mb='xs'>
												<Text size='sm' fw={500}>
													Turned in
												</Text>
												<Text size='sm' fw={600} c='blue'>
													{turnedInCount}
												</Text>
											</Group>
											<Group justify='space-between'>
												<Text size='sm' fw={500}>
													Graded
												</Text>
												<Text size='sm' fw={600} c='green'>
													{gradedCount}
												</Text>
											</Group>
										</Box>
									</Stack>
								</Paper>
							)}
						</Stack>
					</Grid.Col>
				</Grid>

				{courseWork.workType !== 'MATERIAL' && submissions.length > 0 && (
					<Paper shadow='xs' p='xl' radius='md'>
						<Stack gap='lg'>
							<Group justify='space-between'>
								<Title order={2} size='h3'>
									Student Submissions
								</Title>
								<Badge size='lg' variant='light'>
									{submissions.length} students
								</Badge>
							</Group>

							<Stack gap='xs'>
								{submissions.map((submission) => (
									<Card
										key={submission.id}
										withBorder
										padding='md'
										radius='sm'
										style={{ transition: 'all 0.2s' }}
										className='hover-lift'
									>
										<Group justify='space-between' wrap='nowrap'>
											<Group gap='md' style={{ flex: 1, minWidth: 0 }}>
												<Box
													style={{
														width: '2.5rem',
														height: '2.5rem',
														borderRadius: '50%',
														background: 'var(--mantine-color-blue-1)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														flexShrink: 0,
													}}
												>
													<IconUser
														size='1.25rem'
														style={{ color: 'var(--mantine-color-blue-6)' }}
													/>
												</Box>
												<Box style={{ flex: 1, minWidth: 0 }}>
													<Text size='sm' fw={500} lineClamp={1}>
														{submission.userId}
													</Text>
													<Group gap='xs' mt='0.25rem'>
														<Badge
															size='sm'
															variant='dot'
															color={getStateColor(submission.state)}
															leftSection={<IconPointFilled size='0.5rem' />}
														>
															{getStateLabel(submission.state)}
														</Badge>
														{submission.late && (
															<Badge size='sm' color='red' variant='light'>
																Late
															</Badge>
														)}
													</Group>
												</Box>
											</Group>

											{(submission.assignedGrade !== null &&
												submission.assignedGrade !== undefined) ||
											submission.draftGrade !== null ? (
												<Box style={{ textAlign: 'right', flexShrink: 0 }}>
													<Text size='xl' fw={700} c='blue' mb='0.25rem'>
														{submission.assignedGrade ?? submission.draftGrade}
													</Text>
													<Text size='xs' c='dimmed'>
														/ {courseWork.maxPoints}
													</Text>
												</Box>
											) : (
												<Box style={{ textAlign: 'right', flexShrink: 0 }}>
													<Text size='sm' c='dimmed'>
														Not graded
													</Text>
												</Box>
											)}
										</Group>
									</Card>
								))}
							</Stack>
						</Stack>
					</Paper>
				)}
			</Stack>

			<style>{`
				.hover-lift:hover {
					transform: translateY(-2px);
					box-shadow: var(--mantine-shadow-md);
				}
			`}</style>
		</Container>
	);
}
