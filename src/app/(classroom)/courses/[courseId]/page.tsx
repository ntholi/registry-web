import {
	AssessmentsTabWrapper,
	DashboardTabWrapper,
	getCourse,
	MaterialTabWrapper,
} from '@classroom/courses';
import {
	Badge,
	Box,
	Button,
	Container,
	Flex,
	Group,
	Paper,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconBook2,
	IconChalkboard,
	IconClipboardCheck,
	IconExternalLink,
	IconSchool,
} from '@tabler/icons-react';
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
		<Box mih='100vh'>
			<Tabs defaultValue='dashboard' variant='default' keepMounted={false}>
				<Box>
					<Container size='xl' pt='lg'>
						<Stack gap='xl'>
							<Paper withBorder p='lg'>
								<Flex justify='space-between' align='flex-start'>
									<Stack gap='xs'>
										<Group gap='md' align='center'>
											<ThemeIcon
												size={42}
												radius='md'
												variant='light'
												color='blue'
											>
												<IconSchool size={24} />
											</ThemeIcon>
											<Box>
												<Title
													order={1}
													size={28}
													fw={700}
													style={{ lineHeight: 1.1 }}
												>
													{course.name}
												</Title>
												<Group gap='xs' mt={4}>
													{course.section && (
														<Text size='sm' c='dimmed' fw={500}>
															{course.section}
														</Text>
													)}
													{course.room && (
														<>
															<Text size='sm' c='dimmed'>
																•
															</Text>
															<Badge size='sm' variant='dot' color='gray'>
																Room {course.room}
															</Badge>
														</>
													)}
												</Group>
											</Box>
										</Group>
									</Stack>

									{course.alternateLink && (
										<Button
											component='a'
											href={course.alternateLink}
											target='_blank'
											variant='default'
											size='xs'
											leftSection={<IconExternalLink size={14} />}
										>
											Google Classroom
										</Button>
									)}
								</Flex>
							</Paper>

							<TabsList style={{ borderBottom: 'none' }}>
								<TabsTab
									value='dashboard'
									leftSection={<IconChalkboard size={16} />}
									pb='md'
									px='lg'
									fw={500}
								>
									Dashboard
								</TabsTab>
								<TabsTab
									value='assessments'
									leftSection={<IconClipboardCheck size={16} />}
									pb='md'
									px='lg'
									fw={500}
								>
									Assessments
								</TabsTab>
								<TabsTab
									value='material'
									leftSection={<IconBook2 size={16} />}
									pb='md'
									px='lg'
									fw={500}
								>
									Material
								</TabsTab>
							</TabsList>
						</Stack>
					</Container>
				</Box>

				<Box py='xl'>
					<Container size='xl'>
						<TabsPanel value='dashboard'>
							<DashboardTabWrapper courseId={courseId} />
						</TabsPanel>

						<TabsPanel value='assessments'>
							<AssessmentsTabWrapper courseId={courseId} />
						</TabsPanel>

						<TabsPanel value='material'>
							<MaterialTabWrapper courseId={courseId} />
						</TabsPanel>
					</Container>
				</Box>
			</Tabs>
		</Box>
	);
}
