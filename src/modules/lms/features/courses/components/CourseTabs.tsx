'use client';

import { getMainForum } from '@lms/forum';
import ForumPostForm from '@lms/forum/components/ForumPostForm';
import ForumPostsList from '@lms/forum/components/ForumPostsList';
import { Box, Loader, Tabs, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { MoodleCourse } from '../types';

type CourseTabsProps = {
	course: MoodleCourse;
};

export default function CourseTabs({ course }: CourseTabsProps) {
	const [activeTab, setActiveTab] = useState<string | null>('dashboard');

	const { data: forum, isLoading } = useQuery({
		queryKey: ['forum', course.id],
		queryFn: () => getMainForum(course.id),
		enabled: activeTab === 'forum',
	});

	return (
		<Tabs
			value={activeTab}
			onChange={setActiveTab}
			variant='outline'
			keepMounted={false}
			mt='xl'
		>
			<Tabs.List>
				<Tabs.Tab value='dashboard'>Dashboard</Tabs.Tab>
				<Tabs.Tab value='forum'>Forum</Tabs.Tab>
				<Tabs.Tab value='assessments'>Assessments</Tabs.Tab>
				<Tabs.Tab value='material'>Material</Tabs.Tab>
				<Tabs.Tab value='students'>Students</Tabs.Tab>
				<Box ml='auto' mt={-5}>
					{activeTab === 'forum' && forum && (
						<ForumPostForm forumId={forum.id} />
					)}
				</Box>
			</Tabs.List>
			<Tabs.Panel value='dashboard' pt='lg'>
				<Box p='sm'>
					<Text size='sm' c='dimmed'>
						Welcome to {course.fullname}. Use the tabs above to navigate through
						course content, discussions, assessments, and more.
					</Text>
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='forum' pt='lg'>
				<Box p='sm'>
					{isLoading ? (
						<Box ta='center' py='xl'>
							<Loader />
						</Box>
					) : !forum ? (
						<Box ta='center' py='xl'>
							<Text c='dimmed'>No forum available for this course</Text>
						</Box>
					) : (
						<ForumPostsList forumId={forum.id} />
					)}
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='assessments' pt='lg'>
				<Box p='sm'>
					<Text size='sm' c='dimmed'>
						Assessments for {course.shortname} will appear here.
					</Text>
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='material' pt='lg'>
				<Box p='sm'>
					<Text size='sm' c='dimmed'>
						Learning material will be organized here.
					</Text>
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='students' pt='lg'>
				<Box p='sm'>
					<Text size='sm' c='dimmed'>
						Student roster and activity will show up here.
					</Text>
				</Box>
			</Tabs.Panel>
		</Tabs>
	);
}
