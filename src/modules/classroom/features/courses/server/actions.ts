'use server';

import type { classroom_v1 } from 'googleapis';
import { auth } from '@/core/auth';
import { assignedModulesRepository } from '@/modules/academic/features/assigned-modules/server/repository';
import googleClassroom from '@/core/integrations/google-classroom';

export async function getCourse(courseId: string) {
	try {
		const classroom = await googleClassroom();
		const course = await classroom.courses.get({ id: courseId });
		return course.data;
	} catch {
		return null;
	}
}

export async function getCourses() {
	try {
		const classroom = await googleClassroom();
		const courses = await classroom.courses.list({ courseStates: ['ACTIVE'] });
		return courses.data.courses || [];
	} catch {
		return [];
	}
}

export async function getCourseAnnouncements(courseId: string) {
	try {
		const classroom = await googleClassroom();
		const announcements = await classroom.courses.announcements.list({
			courseId,
			orderBy: 'updateTime desc',
		});
		return announcements.data.announcements || [];
	} catch {
		return [];
	}
}

export async function getCourseWork(courseId: string) {
	try {
		const classroom = await googleClassroom();
		const courseWork = await classroom.courses.courseWork.list({
			courseId,
			orderBy: 'updateTime desc',
		});
		return courseWork.data.courseWork || [];
	} catch {
		return [];
	}
}

export async function getCourseWorkById(
	courseId: string,
	courseWorkId: string
) {
	try {
		const classroom = await googleClassroom();
		const courseWork = await classroom.courses.courseWork.get({
			courseId,
			id: courseWorkId,
		});
		return courseWork.data;
	} catch {
		return null;
	}
}

export async function getCourseWorkSubmissions(
	courseId: string,
	courseWorkId: string
) {
	try {
		const classroom = await googleClassroom();
		const submissions =
			await classroom.courses.courseWork.studentSubmissions.list({
				courseId,
				courseWorkId,
			});
		return submissions.data.studentSubmissions || [];
	} catch {
		return [];
	}
}

export async function getCourseTopics(courseId: string) {
	try {
		const classroom = await googleClassroom();
		const topics = await classroom.courses.topics.list({
			courseId,
		});
		return topics.data.topic || [];
	} catch {
		return [];
	}
}

export type CourseWork = classroom_v1.Schema$CourseWork;
export type Announcement = classroom_v1.Schema$Announcement;
export type Course = classroom_v1.Schema$Course;
export type Topic = classroom_v1.Schema$Topic;
export type StudentSubmission = classroom_v1.Schema$StudentSubmission;

export async function getUserAssignedModules() {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return [];
		}

		const assigned = await assignedModulesRepository.findByUser(session.user.id);

		return assigned.map((item) => ({
			semesterModuleId: item.semesterModuleId,
			moduleName: item.semesterModule?.module?.name || '',
			moduleCode: item.semesterModule?.module?.code || '',
			programCode:
				item.semesterModule?.semester?.structure?.program?.code || '',
		}));
	} catch {
		return [];
	}
}

export async function createCourse(data: {
	name: string;
	section: string;
	subject: string;
}) {
	try {
		const classroom = await googleClassroom();
		const course = await classroom.courses.create({
			requestBody: {
				name: data.name,
				section: data.section,
				descriptionHeading: data.subject,
				courseState: 'ACTIVE',
				ownerId: 'me',
			},
		});
		return { success: true, data: course.data };
	} catch (error) {
		console.error('Failed to create course:', error);
		return { success: false, error: 'Failed to create course' };
	}
}
