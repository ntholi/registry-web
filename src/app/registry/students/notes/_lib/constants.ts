import { IconLock, IconUsers, IconWorld } from '@tabler/icons-react';
import {
	ALLOWED_ATTACHMENT_MIME_TYPES,
	MAX_ATTACHMENT_SIZE,
} from '@/shared/lib/utils/attachments';
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

export const ALLOWED_MIME_TYPES = ALLOWED_ATTACHMENT_MIME_TYPES;
export { MAX_ATTACHMENT_SIZE };

export function getInitials(name: string | null): string {
	if (!name) return '?';
	return name
		.split(' ')
		.slice(0, 2)
		.map((n) => n[0])
		.join('')
		.toUpperCase();
}
