import {
	IconChecklist,
	IconNote,
	IconUserExclamation,
	IconUserPlus,
	IconUsers,
} from '@tabler/icons-react';
import { countPendingStudentStatuses } from '@/app/registry/student-statuses';
import type { NavItem } from '../types';

export const studentServicesNav: NavItem[] = [
	{
		label: 'Students',
		href: '/registry/students',
		icon: IconUsers,
		permissions: [{ resource: 'students', action: 'read' }],
	},
	{
		label: 'Tasks',
		href: '/admin/tasks',
		icon: IconChecklist,
		permissions: [{ resource: 'tasks', action: 'read' }],
	},
	{
		label: 'Registration',
		href: '/registry/registration/requests',
		icon: IconUserPlus,
		permissions: [{ resource: 'registration', action: 'read' }],
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
		description: 'Notes on Students',
		href: '/registry/student-notes',
		icon: IconNote,
		permissions: [{ resource: 'student-notes', action: 'read' }],
	},
];
