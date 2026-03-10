import { IconLock, IconUsers, IconWorld } from '@tabler/icons-react';
import type { NoteVisibility } from '../_schema/studentNotes';

export const VISIBILITY_OPTIONS = [
	{ label: 'My Department', value: 'role' },
	{ label: 'Only Me', value: 'self' },
	{ label: 'Everyone', value: 'everyone' },
];

export const VISIBILITY_HINT: Record<NoteVisibility, string> = {
	role: 'This note will only be visible to members of your department.',
	self: 'This note will only be visible to you.',
	everyone: 'This note will be visible to all staff.',
};

export const VISIBILITY_CONFIG: Record<
	NoteVisibility,
	{ icon: typeof IconUsers; color: string; label: string }
> = {
	role: { icon: IconUsers, color: 'blue', label: 'Department' },
	self: { icon: IconLock, color: 'red', label: 'Only Me' },
	everyone: { icon: IconWorld, color: 'green', label: 'Everyone' },
};

export const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

export function getInitials(name: string | null): string {
	if (!name) return '?';
	return name
		.split(' ')
		.slice(0, 2)
		.map((n) => n[0])
		.join('')
		.toUpperCase();
}
