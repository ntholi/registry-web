import { countUncompletedTasks } from '@admin/tasks';
import { countPendingDocumentsForReview } from '@admissions/documents/_server/actions';
import { countPendingPaymentsForReview } from '@admissions/payments/_server/actions';
import { countPendingGraduationClearances } from '@registry/graduation';
import { countPendingClearances } from '@registry/registration';
import { countPendingStudentStatuses } from '@registry/student-statuses';
import {
	IconActivity,
	IconBell,
	IconBook,
	IconBook2,
	IconBooks,
	IconBuildingBank,
	IconBuildingCommunity,
	IconCalculator,
	IconCalendar,
	IconCalendarDue,
	IconCalendarEvent,
	IconCash,
	IconCategory,
	IconCertificate,
	IconChartBar,
	IconChecklist,
	IconClipboardCheck,
	IconClipboardData,
	IconClipboardList,
	IconCreditCard,
	IconDeviceDesktopAnalytics,
	IconDoor,
	IconEye,
	IconFileExport,
	IconFileSearch,
	IconFileText,
	IconFlask,
	IconGavel,
	IconInbox,
	IconLayoutGrid,
	IconLibrary,
	IconListCheck,
	IconMail,
	IconMessageQuestion,
	IconMessageStar,
	IconNote,
	IconPackage,
	IconPresentation,
	IconPrinter,
	IconReportAnalytics,
	IconRobot,
	IconSchool,
	IconSearch,
	IconSend,
	IconSettings,
	IconShield,
	IconStack2,
	IconTags,
	IconUserCheck,
	IconUserExclamation,
	IconUserOff,
	IconUserPlus,
	IconUserShield,
	IconUsers,
	IconWriting,
} from '@tabler/icons-react';
import type { Session } from '@/core/auth';
import { hasAnyPermission } from '@/core/auth/sessionPermissions';
import type { NavItem } from '../types';

function isTimetableEditor(session: Session | null) {
	return hasAnyPermission(session, 'timetable', ['create', 'update', 'delete']);
}

export const adminNav: NavItem[] = [
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
		label: 'Users',
		href: '/admin/users',
		icon: IconUserShield,
		permissions: [{ resource: 'users', action: 'read' }],
	},
	{
		label: 'Permission Presets',
		href: '/admin/permission-presets',
		icon: IconShield,
		permissions: [{ resource: 'permission-presets', action: 'read' }],
	},
	{
		label: 'Notifications',
		href: '/admin/notifications',
		icon: IconBell,
		permissions: [{ resource: 'notifications', action: 'read' }],
	},
	{
		label: 'Activity Tracker',
		href: '/admin/activity-tracker',
		icon: IconActivity,
		permissions: [{ resource: 'activity-tracker', action: 'read' }],
	},
	{
		label: 'Tools',
		icon: IconSettings,
		collapsed: true,
		children: [
			{
				label: 'Simulator',
				href: '/admin/tools/simulate',
				icon: IconFlask,
			},
			{
				label: 'Grade Calculator',
				href: '/admin/tools/grade-calculator',
				icon: IconCalculator,
			},
			{
				label: 'Grade Finder',
				href: '/admin/tools/grade-finder',
				icon: IconSearch,
			},
		] as NavItem[],
	},
	{
		label: 'Bulk',
		icon: IconPackage,
		children: [
			{
				label: 'Export Transcript',
				href: '/admin/bulk/transcripts',
				icon: IconFileExport,
			},
		] as NavItem[],
	},
	{
		label: 'Students',
		href: '/registry/students',
		icon: IconUsers,
		permissions: [{ resource: 'students', action: 'read' }],
	},
	{
		label: 'Registration',
		href: '/registry/registration/requests',
		icon: IconUserPlus,
		permissions: [{ resource: 'registration', action: 'read' }],
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
		label: 'Auto-Approvals',
		href: '/registry/clearance/auto-approve',
		icon: IconRobot,
		permissions: [{ resource: 'auto-approvals', action: 'read' }],
	},
	{
		label: 'Graduations',
		icon: IconSchool,
		collapsed: true,
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
		label: 'Modules',
		href: '/academic/modules',
		icon: IconBook,
		permissions: [{ resource: 'modules', action: 'read' }],
	},
	{
		label: 'Semester Modules',
		href: '/academic/semester-modules',
		icon: IconBooks,
		permissions: [{ resource: 'semester-modules', action: 'read' }],
	},
	{
		label: 'Schools',
		href: '/academic/schools',
		icon: IconSchool,
		permissions: [{ resource: 'school-structures', action: 'read' }],
	},
	{
		label: 'LMS',
		description: 'Learning Management System',
		icon: IconDeviceDesktopAnalytics,
		href: '/lms/courses',
		permissions: [{ resource: 'assigned-modules', action: 'read' }],
	},
	{
		label: 'Timetable',
		icon: IconCalendar,
		collapsed: true,
		children: [
			{
				label: 'Viewer',
				icon: IconCalendar,
				href: '/timetable/viewer',
				permissions: [{ resource: 'timetable', action: 'read' }],
			},
			{
				label: 'Allocations',
				icon: IconLayoutGrid,
				href: '/timetable/timetable-allocations',
				isVisible: isTimetableEditor,
			},
			{
				label: 'Venues',
				icon: IconDoor,
				href: '/timetable/venues',
				permissions: [{ resource: 'venues', action: 'read' }],
			},
			{
				label: 'Venue Types',
				icon: IconTags,
				href: '/timetable/venue-types',
				permissions: [{ resource: 'venues', action: 'read' }],
			},
		],
	},
	{
		label: 'Sponsors',
		href: '/finance/sponsors',
		icon: IconBuildingBank,
		permissions: [{ resource: 'sponsors', action: 'read' }],
	},
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
		label: 'Admissions Payments',
		href: '/admissions/payments',
		icon: IconCreditCard,
		permissions: [{ resource: 'admissions-payments', action: 'read' }],
		notificationCount: {
			queryKey: ['payments', 'pending-review-count'],
			queryFn: countPendingPaymentsForReview,
			color: 'red',
		},
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
		label: 'Admissions Settings',
		icon: IconSettings,
		collapsed: true,
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
		] as NavItem[],
	},
	{
		label: 'Employees',
		href: '/human-resource/employees',
		icon: IconUsers,
		permissions: [{ resource: 'employees', action: 'read' }],
	},
	{
		label: 'Appraisals',
		icon: IconClipboardData,
		collapsed: true,
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
		label: 'Library',
		icon: IconLibrary,
		collapsed: true,
		permissions: [{ resource: 'library', action: 'read' }],
		children: [
			{
				label: 'Catalog',
				href: '/library/catalog',
				icon: IconBooks,
			},
			{
				label: 'Books',
				href: '/library/books',
				icon: IconBook2,
			},
			{
				label: 'Loans',
				href: '/library/loans',
				icon: IconLibrary,
			},
			{
				label: 'Authors',
				href: '/library/authors',
				icon: IconUsers,
			},
			{
				label: 'Categories',
				href: '/library/categories',
				icon: IconCategory,
			},
			{
				label: 'Fines',
				href: '/library/fines',
				icon: IconCash,
			},
			{
				label: 'Resources',
				icon: IconTags,
				collapsed: true,
				children: [
					{
						label: 'Publications',
						href: '/library/resources/publications',
						icon: IconWriting,
					},
					{
						label: 'Question Papers',
						href: '/library/resources/question-papers',
						icon: IconFileText,
					},
				],
			},
			{
				label: 'Settings',
				href: '/library/settings',
				icon: IconSettings,
			},
		],
	},
	{
		label: 'Reports',
		icon: IconReportAnalytics,
		collapsed: true,
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
			{
				label: 'Sponsored Students',
				href: '/reports/finance/sponsored-students',
				icon: IconReportAnalytics,
				permissions: [
					{ resource: 'reports-sponsored-students', action: 'read' },
				],
			},
		],
	},
	{
		label: 'Mail',
		icon: IconMail,
		collapsed: true,
		children: [
			{
				label: 'Inbox',
				href: '/mail/inbox',
				icon: IconInbox,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Accounts',
				href: '/mail/accounts',
				icon: IconUserCheck,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Sent',
				href: '/mail/sent',
				icon: IconSend,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Queue',
				href: '/mail/queue',
				icon: IconStack2,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Settings',
				href: '/mail/settings',
				icon: IconSettings,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
		],
	},
];
