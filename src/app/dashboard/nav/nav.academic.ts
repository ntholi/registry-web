import { countPendingGraduationClearances } from '@registry/graduation';
import {
	IconCalendarEvent,
	IconCertificate,
	IconChartBar,
	IconChecklist,
	IconClipboardCheck,
	IconClipboardData,
	IconDeviceDesktopAnalytics,
	IconEye,
	IconGavel,
	IconListCheck,
	IconMessageQuestion,
	IconMessageStar,
	IconPresentation,
	IconReportAnalytics,
	IconSchool,
	IconUsers,
} from '@tabler/icons-react';
import { createElement } from 'react';
import { countUncompletedTasks } from '@/app/admin/tasks';
import type { NavItem } from '../types';
import { LmsLabel } from './LmsLabel';

export const academicNav: NavItem[] = [
	{
		label: 'Students',
		href: '/registry/students',
		icon: IconUsers,
		permissions: [{ resource: 'students', action: 'read' }],
	},
	{
		label: 'Lecturers',
		description: 'Assigned Modules',
		href: '/academic/lecturers',
		icon: IconPresentation,
		permissions: [{ resource: 'lecturers', action: 'read' }],
	},
	{
		label: 'Assessments',
		href: '/academic/assessments',
		icon: IconListCheck,
		permissions: [{ resource: 'assessments', action: 'read' }],
	},
	{
		label: 'Attendance',
		href: '/academic/attendance',
		icon: IconCalendarEvent,
		permissions: [{ resource: 'attendance', action: 'read' }],
	},
	{
		label: 'Gradebook',
		icon: IconClipboardData,
		collapsed: false,
		children: [],
		permissions: [{ resource: 'gradebook', action: 'read' }],
	},
	{
		label: createElement(LmsLabel),
		description: 'Learning Management System',
		icon: IconDeviceDesktopAnalytics,
		href: '/lms/courses',
		permissions: [{ resource: 'assigned-modules', action: 'read' }],
	},
	{
		label: 'Tasks',
		href: '/admin/tasks',
		icon: IconChecklist,
		permissions: [{ resource: 'tasks', action: 'read' }],
		notificationCount: {
			queryKey: ['tasks', 'uncompleted'],
			queryFn: () => countUncompletedTasks(),
			color: 'red',
		},
	},
	{
		label: 'Schools',
		href: '/academic/schools',
		icon: IconSchool,
		permissions: [{ resource: 'school-structures', action: 'read' }],
	},
	{
		label: 'Graduation Clearance',
		href: '/registry/graduation/clearance',
		icon: IconCertificate,
		collapsed: false,
		permissions: [{ resource: 'graduation-clearance', action: 'read' }],
		notificationCount: {
			queryKey: ['graduation-clearances', 'pending'],
			queryFn: () => countPendingGraduationClearances(),
			color: 'red',
		},
	},
	{
		label: 'Appraisals',
		icon: IconClipboardData,
		collapsed: false,
		children: [
			{
				label: 'Cycles',
				href: '/appraisals/cycles',
				icon: IconCalendarEvent,
				permissions: [{ resource: 'feedback-cycles', action: 'read' }],
			},
			{
				label: 'Reports',
				href: '/appraisals/reports',
				icon: IconChartBar,
				permissions: [
					{ resource: 'student-feedback-reports', action: 'read' },
					{ resource: 'teaching-observation-reports', action: 'read' },
				],
			},
			{
				label: 'Student Feedback',
				icon: IconMessageStar,
				collapsed: false,
				children: [
					{
						label: 'Questions',
						href: '/appraisals/student-feedback/questions',
						icon: IconMessageQuestion,
						permissions: [
							{ resource: 'student-feedback-questions', action: 'read' },
						],
					},
				],
			},
			{
				label: 'Teaching Observation',
				icon: IconEye,
				collapsed: false,
				children: [
					{
						label: 'Criteria',
						href: '/appraisals/observation-criteria',
						icon: IconListCheck,
						permissions: [
							{ resource: 'teaching-observation-criteria', action: 'read' },
						],
					},
					{
						label: 'Observations',
						href: '/appraisals/teaching-observations',
						icon: IconClipboardCheck,
						permissions: [
							{ resource: 'teaching-observations', action: 'read' },
						],
					},
				],
			},
		],
	},
	{
		label: 'Reports',
		icon: IconReportAnalytics,
		collapsed: false,
		children: [
			{
				label: 'Course Summary',
				href: '/reports/academic/course-summary',
				icon: IconReportAnalytics,
				permissions: [{ resource: 'reports-course-summary', action: 'read' }],
			},
			{
				label: 'Attendance',
				href: '/reports/academic/attendance',
				icon: IconReportAnalytics,
				permissions: [{ resource: 'reports-attendance', action: 'read' }],
			},
			{
				label: 'Board of Examination',
				href: '/reports/academic/boe',
				icon: IconGavel,
				permissions: [{ resource: 'reports-boe', action: 'read' }],
			},
			{
				label: 'Student Enrollments',
				href: '/reports/registry/student-enrollments',
				icon: IconReportAnalytics,
				permissions: [{ resource: 'reports-enrollments', action: 'read' }],
			},
			{
				label: 'Graduations',
				href: '/reports/registry/graduations',
				icon: IconSchool,
				permissions: [{ resource: 'reports-graduation', action: 'read' }],
			},
		],
	},
	{
		label: 'Activity Tracker',
		href: '/admin/activity-tracker',
		icon: IconReportAnalytics,
		permissions: [{ resource: 'activity-tracker', action: 'read' }],
	},
];
