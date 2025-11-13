'use server';

import type { classroom_v1 } from 'googleapis';
import googleClassroom from '@/shared/lib/googleClassroom';

export async function getCourse(courseId: string) {
	try {
		const classroom = await googleClassroom();
		const course = await classroom.courses.get({ id: courseId });
		return course.data;
	} catch {
		return null;
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
