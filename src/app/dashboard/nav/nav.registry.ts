import {
	IconActivity,
	IconBell,
	IconBook,
	IconBooks,
	IconBuildingBank,
	IconBuildingCommunity,
	IconCalendarDue,
	IconCalendarEvent,
	IconCertificate,
	IconChecklist,
	IconClipboardCheck,
	IconClipboardList,
	IconDoor,
	IconFileSearch,
	IconNote,
	IconPrinter,
	IconReportAnalytics,
	IconSchool,
	IconSettings,
	IconTags,
	IconUserExclamation,
	IconUserOff,
	IconUsers,
} from '@tabler/icons-react';
import { countPendingDocumentsForReview } from '@/app/admissions/documents/_server/actions';
import { countPendingGraduationClearances } from '@/app/registry/graduation';
import { countPendingClearances } from '@/app/registry/registration';
import { countPendingStudentStatuses } from '@/app/registry/student-statuses';
import type { NavItem } from '../types';

export const registryNav: NavItem[] = [
	{
		label: 'Students',
		href: '/registry/students',
		icon: IconUsers,
		permissions: [{ resource: 'students', action: 'read' }],
	},
	{
		label: 'Registration Clearance',
		href: '/registry/registration/clearance',
		icon: IconClipboardCheck,
		permissions: [{ resource: 'registration-clearance', action: 'read' }],
		notificationCount: {
			queryKey: ['clearances', 'pending'],
			queryFn: () => countPendingClearances(),
			color: 'red',
		},
	},
	{
		label: 'Graduations',
		icon: IconSchool,
		collapsed: false,
		permissions: [{ resource: 'graduation', action: 'read' }],
		children: [
			{
				label: 'Requests',
				href: '/registry/graduation/requests',
				icon: IconCertificate,
			},
			{
				label: 'Dates',
				href: '/registry/graduation/dates',
				icon: IconCalendarEvent,
			},
			{
				label: 'Certificate Reprints',
				href: '/registry/certificate-reprints',
				icon: IconPrinter,
				permissions: [{ resource: 'certificate-reprints', action: 'read' }],
			},
		],
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
		label: 'Notes',
		href: '/registry/student-notes',
		icon: IconNote,
		permissions: [{ resource: 'student-notes', action: 'read' }],
	},
	{
		label: 'Blocked Students',
		href: '/registry/blocked-students',
		icon: IconUserOff,
		permissions: [{ resource: 'blocked-students', action: 'read' }],
	},
	{
		label: 'Terms',
		href: '/registry/terms',
		icon: IconCalendarDue,
		permissions: [{ resource: 'terms-settings', action: 'read' }],
	},
	{
		label: 'Modules',
		href: '/academic/modules',
		icon: IconBook,
		permissions: [{ resource: 'modules', action: 'create' }],
	},
	{
		label: 'Semester Modules',
		href: '/academic/semester-modules',
		icon: IconBooks,
		permissions: [{ resource: 'semester-modules', action: 'create' }],
	},
	{
		label: 'Schools',
		href: '/academic/schools',
		icon: IconSchool,
		permissions: [{ resource: 'school-structures', action: 'update' }],
	},
	{
		label: 'Venues',
		icon: IconDoor,
		href: '/timetable/venues',
		permissions: [{ resource: 'venues', action: 'create' }],
	},
	{
		label: 'Venue Types',
		icon: IconTags,
		href: '/timetable/venue-types',
		permissions: [{ resource: 'venues', action: 'create' }],
	},
	{
		label: 'Sponsors',
		href: '/finance/sponsors',
		icon: IconBuildingBank,
		permissions: [{ resource: 'sponsors', action: 'read' }],
	},
	{
		label: 'Graduation Clearance',
		href: '/registry/graduation/clearance',
		icon: IconCertificate,
		permissions: [{ resource: 'graduation-clearance', action: 'read' }],
		notificationCount: {
			queryKey: ['graduation-clearances', 'pending'],
			queryFn: () => countPendingGraduationClearances(),
			color: 'red',
		},
	},
	{
		label: 'Admissions',
		icon: IconSchool,
		collapsed: false,
		children: [
			{
				label: 'Applicants',
				href: '/admissions/applicants',
				icon: IconUsers,
				permissions: [{ resource: 'applicants', action: 'read' }],
			},
			{
				label: 'Applications',
				href: '/admissions/applications',
				icon: IconClipboardList,
				permissions: [{ resource: 'applications', action: 'read' }],
			},
			{
				label: 'Document Review',
				href: '/admissions/documents',
				icon: IconFileSearch,
				permissions: [{ resource: 'admissions-documents', action: 'read' }],
				notificationCount: {
					queryKey: ['documents', 'pending-review-count'],
					queryFn: countPendingDocumentsForReview,
					color: 'red',
				},
			},
			{
				label: 'Settings',
				icon: IconSettings,
				collapsed: false,
				children: [
					{
						label: 'Intake Periods',
						href: '/admissions/intake-periods',
						icon: IconCalendarEvent,
						permissions: [{ resource: 'intake-periods', action: 'read' }],
					},
					{
						label: 'Certificate Types',
						href: '/admissions/certificate-types',
						icon: IconCertificate,
						permissions: [{ resource: 'certificate-types', action: 'read' }],
					},
					{
						label: 'Subjects',
						href: '/admissions/subjects',
						icon: IconBook,
						permissions: [{ resource: 'subjects', action: 'read' }],
					},
					{
						label: 'Recognized Schools',
						href: '/admissions/recognized-schools',
						icon: IconBuildingCommunity,
						permissions: [{ resource: 'recognized-schools', action: 'read' }],
					},
					{
						label: 'Entry Requirements',
						href: '/admissions/entry-requirements',
						icon: IconChecklist,
						permissions: [{ resource: 'entry-requirements', action: 'read' }],
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
				label: 'Attendance',
				href: '/reports/academic/attendance',
				icon: IconReportAnalytics,
				permissions: [{ resource: 'reports-attendance', action: 'read' }],
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
		label: 'Tasks',
		href: '/admin/tasks',
		icon: IconChecklist,
		permissions: [{ resource: 'tasks', action: 'read' }],
	},
	{
		label: 'Activity Tracker',
		href: '/admin/activity-tracker',
		icon: IconActivity,
		permissions: [{ resource: 'activity-tracker', action: 'read' }],
	},
	{
		label: 'Notifications',
		href: '/admin/notifications',
		icon: IconBell,
		permissions: [{ resource: 'notifications', action: 'read' }],
	},
];
