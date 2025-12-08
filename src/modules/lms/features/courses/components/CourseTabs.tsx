'use client';

import { AssessmentForm, AssessmentsList } from '@lms/assessment';
import { CourseOutline, CourseOutlineDownload } from '@lms/course-outline';
import { Gradebook, getAssignedModuleByCourseId } from '@lms/gradebook';
import MaterialForm from '@lms/material/components/MaterialForm';
import MaterialList from '@lms/material/components/MaterialList';
import { PostForm, PostsList } from '@lms/posts';
import { QuizForm, QuizzesList } from '@lms/quizzes';
import { getEnrolledStudentsFromDB } from '@lms/students';
import AddStudentModal from '@lms/students/components/AddStudentModal';
import StudentsList from '@lms/students/components/StudentsList';
import {
	VirtualClassroomForm,
	VirtualClassroomList,
} from '@lms/virtual-classroom';
import { Badge, Box, Tabs } from '@mantine/core';
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
				<Tabs.Tab value='posts'>Posts</Tabs.Tab>
				<Tabs.Tab value='assessments'>Assessments</Tabs.Tab>
				<Tabs.Tab value='quizzes'>Tests & Quizzes</Tabs.Tab>
				<Tabs.Tab value='material'>Material</Tabs.Tab>
				<Tabs.Tab value='outline'>Outline</Tabs.Tab>
				<Tabs.Tab value='students'>
					Students
					{students && students.length > 0 && (
						<Badge ml='xs' size='sm' variant='default' color='gray'>
							{students.length}
						</Badge>
					)}
				</Tabs.Tab>
				<Tabs.Tab value='gradebook'>Gradebook</Tabs.Tab>
				<Tabs.Tab value='virtual-classroom'>Virtual Class</Tabs.Tab>
				<Box ml='auto' mt={-5}>
					{activeTab === 'posts' && <PostForm courseId={course.id} />}
					{activeTab === 'assessments' && moduleId && (
						<AssessmentForm courseId={course.id} moduleId={moduleId} />
					)}
					{activeTab === 'quizzes' && moduleId && (
						<QuizForm courseId={course.id} moduleId={moduleId} />
					)}
					{activeTab === 'material' && <MaterialForm courseId={course.id} />}
					{activeTab === 'outline' && (
						<CourseOutlineDownload
							courseId={course.id}
							courseName={course.fullname}
							courseCode={course.shortname}
						/>
					)}
					{activeTab === 'students' && <AddStudentModal course={course} />}
					{activeTab === 'virtual-classroom' && (
						<VirtualClassroomForm courseId={course.id} />
					)}
				</Box>
			</Tabs.List>
			<Tabs.Panel value='dashboard' pt='lg'>
				<CourseDashboard course={course} />
			</Tabs.Panel>
			<Tabs.Panel value='posts' pt='lg'>
				<Box p='sm'>
					<PostsList courseId={course.id} />
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='assessments' pt='lg'>
				<Box p='sm'>
					<AssessmentsList courseId={course.id} />
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='quizzes' pt='lg'>
				<Box p='sm'>
					<QuizzesList courseId={course.id} />
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='material' pt='lg'>
				<Box p='sm'>
					<MaterialList courseId={course.id} />
				</Box>
			</Tabs.Panel>
			<Tabs.Panel value='outline' pt='lg'>
				<Box p='sm'>
					<CourseOutline courseId={course.id} />
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
			<Tabs.Panel value='virtual-classroom' pt='lg'>
				<Box p='sm'>
					<VirtualClassroomList courseId={course.id} />
				</Box>
			</Tabs.Panel>
		</Tabs>
	);
}
