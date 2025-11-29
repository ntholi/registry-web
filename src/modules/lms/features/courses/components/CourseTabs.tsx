'use client';

import AssessmentForm from '@lms/assessment/components/AssessmentForm';
import AssessmentsList from '@lms/assessment/components/AssessmentsList';
import { getMainForum } from '@lms/forum';
import ForumPostForm from '@lms/forum/components/ForumPostForm';
import ForumPostsList from '@lms/forum/components/ForumPostsList';
import { Gradebook, getAssignedModuleByCourseId } from '@lms/gradebook';
import MaterialForm from '@lms/material/components/MaterialForm';
import MaterialList from '@lms/material/components/MaterialList';
import { getEnrolledStudentsFromDB } from '@lms/students';
import AddStudentModal from '@lms/students/components/AddStudentModal';
import StudentsList from '@lms/students/components/StudentsList';
import { Badge, Box, Loader, Tabs, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import type { MoodleCourse } from '../types';
import CourseDashboard from './CourseDashboard';

type CourseTabsProps = {
	course: MoodleCourse;
};

export default function CourseTabs({ course }: CourseTabsProps) {
	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: 'dashboard',
	});

	const { data: forum, isLoading } = useQuery({
		queryKey: ['forum', course.id],
		queryFn: () => getMainForum(course.id),
		enabled: activeTab === 'forum',
	});

	const { data: students } = useQuery({
		queryKey: ['course-students', course.id],
		queryFn: () => getEnrolledStudentsFromDB(course.id),
	});

	const { data: assignedModule } = useQuery({
		queryKey: ['assigned-module-by-course', course.id],
		queryFn: () => getAssignedModuleByCourseId(course.id),
	});

	const moduleId = assignedModule?.semesterModule?.moduleId;

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
				<Tabs.Tab value='students'>
					Students
					{students && students.length > 0 && (
						<Badge ml='xs' size='sm' variant='default' color='gray'>
							{students.length}
						</Badge>
					)}
				</Tabs.Tab>
				<Tabs.Tab value='gradebook'>Gradebook</Tabs.Tab>
				<Box ml='auto' mt={-5}>
					{activeTab === 'forum' && forum && (
						<ForumPostForm forumId={forum.id} />
					)}
					{activeTab === 'assessments' && moduleId && (
						<AssessmentForm courseId={course.id} moduleId={moduleId} />
					)}
					{activeTab === 'material' && <MaterialForm courseId={course.id} />}
					{activeTab === 'students' && <AddStudentModal course={course} />}
				</Box>
			</Tabs.List>
			<Tabs.Panel value='dashboard' pt='lg'>
				<CourseDashboard course={course} />
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
					<AssessmentsList courseId={course.id} />
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='material' pt='lg'>
				<Box p='sm'>
					<MaterialList courseId={course.id} />
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='students' pt='lg'>
				<Box p='sm'>
					<StudentsList courseId={course.id} />
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='gradebook' pt='lg'>
				<Box p='sm'>
					<Gradebook courseId={course.id} />
				</Box>
			</Tabs.Panel>
		</Tabs>
	);
}
