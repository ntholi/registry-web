import { countPendingGraduationClearances } from '@registry/graduation';
import { countPendingReferrals } from '@student-services/referrals';
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
	IconMail,
	IconMailSpark,
	IconMessageQuestion,
	IconMessageReport,
	IconMessageStar,
	IconNote,
	IconPresentation,
	IconReportAnalytics,
	IconSchool,
	IconTemplate,
	IconUserExclamation,
	IconUsers,
} from '@tabler/icons-react';
import { createElement } from 'react';
import { countUncompletedTasks } from '@/app/admin/tasks';
import { countPendingStudentStatuses } from '@/app/registry/student-statuses';
import type { NavItem } from '../types';
import { FiveDaysLabel } from './FiveDaysLabel';

export const academicNav: NavItem[] = [
	{
		label: 'Students',
		href: '/registry/students',
		icon: IconUsers,
		permissions: [{ resource: 'students', action: 'read' }],
	},
	{
		label: 'Student Status',
		href: '/registry/student-statuses',
		icon: IconUserExclamation,
		permissions: [{ resource: 'student-statuses', action: 'read' }],
		notificationCount: {
			queryKey: ['student-statuses', 'pending'],
			queryFn: () => countPendingStudentStatuses(),
			color: 'red',
		},
	},
	{
		label: 'Referrals',
		href: '/student-services/referrals',
		icon: IconMessageReport,
		permissions: [{ resource: 'student-referrals', action: 'read' }],
		notificationCount: {
			queryKey: ['referrals', 'pending'],
			queryFn: () => countPendingReferrals(),
			color: 'orange',
		},
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
		label: createElement(FiveDaysLabel),
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
		label: 'Letters',
		icon: IconMail,
		collapsed: false,
		children: [
			{
				label: 'Letters',
				href: '/registry/letters/generate',
				icon: IconMailSpark,
				permissions: [{ resource: 'letters', action: 'read' }],
			},
			{
				label: 'Templates',
				href: '/registry/letters/templates',
				icon: IconTemplate,
				permissions: [{ resource: 'letter-templates', action: 'read' }],
			},
		],
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
		label: 'Notes',
		href: '/registry/student-notes',
		description: 'Notes on Students',
		icon: IconNote,
		permissions: [{ resource: 'student-notes', action: 'read' }],
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
