'use client';

import type { Course } from '@classroom/courses';
import {
	AssessmentsTabWrapper,
	DashboardTabWrapper,
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
	IconPlus,
	IconSchool,
} from '@tabler/icons-react';
import { useLocalStorage } from '@/shared/lib/hooks/use-local-storage';
import CreateAnnouncementButton from '@/modules/classroom/features/courses/components/CreateAnnouncementButton';

type Props = {
	course: Course;
	courseId: string;
};

export default function CoursePageClient({ course, courseId }: Props) {
	const [activeTab, setActiveTab] = useLocalStorage<string | null>(
		'courseDetailsTab',
		'dashboard'
	);

	return (
		<Box mih='100vh'>
			<Tabs
				value={activeTab}
				onChange={setActiveTab}
				variant='default'
				keepMounted={false}
			>
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

								{activeTab === 'dashboard' && (
									<Box ml='auto'>
										<CreateAnnouncementButton courseId={courseId} />
									</Box>
								)}
								{activeTab === 'assessments' && (
									<Box ml='auto'>
										<Button size='xs' leftSection={<IconPlus size={14} />}>
											Create Assessment
										</Button>
									</Box>
								)}
								{activeTab === 'material' && (
									<Box ml='auto'>
										<Button size='xs' leftSection={<IconPlus size={14} />}>
											Create Material
										</Button>
									</Box>
								)}
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
