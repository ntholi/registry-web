'use client';

import { Tabs, Text } from '@mantine/core';
import { useState } from 'react';
import type { MoodleCourse } from '../types';

type CourseTabsProps = {
	course: MoodleCourse;
};

export default function CourseTabs({ course }: CourseTabsProps) {
	const [activeTab, setActiveTab] = useState<string | null>('dashboard');

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
				<Tabs.Tab value='assessments'>Assessments</Tabs.Tab>
				<Tabs.Tab value='material'>Material</Tabs.Tab>
				<Tabs.Tab value='students'>Students</Tabs.Tab>
			</Tabs.List>
			<Tabs.Panel value='dashboard' pt='lg'>
				<Text size='sm' c='dimmed'>
					Dashboard content for {course.fullname}.
				</Text>
			</Tabs.Panel>
			<Tabs.Panel value='assessments' pt='lg'>
				<Text size='sm' c='dimmed'>
					Assessments for {course.shortname} will appear here.
				</Text>
			</Tabs.Panel>
			<Tabs.Panel value='material' pt='lg'>
				<Text size='sm' c='dimmed'>
					Learning material will be organized here.
				</Text>
			</Tabs.Panel>
			<Tabs.Panel value='students' pt='lg'>
				<Text size='sm' c='dimmed'>
					Student roster and activity will show up here.
				</Text>
			</Tabs.Panel>
		</Tabs>
	);
}
