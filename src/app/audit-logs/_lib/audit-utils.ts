import { formatDate } from '@/shared/lib/utils/dates';

export const DEFAULT_EXCLUDE_FIELDS = ['createdAt', 'updatedAt', 'id', 'stdNo'];

export interface FieldLabelMap {
	[key: string]: string;
}

export function formatValue(value: unknown): string {
	if (value === null || value === undefined) return 'Empty';
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	if (value instanceof Date) return formatDate(value);
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
		const date = new Date(value);
		if (!Number.isNaN(date.getTime())) {
			return formatDate(date);
		}
	}
	return String(value);
}

export function formatFieldName(
	field: string,
	fieldLabels?: FieldLabelMap
): string {
	if (fieldLabels?.[field]) return fieldLabels[field];
	return field
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
}

export function getChangedFields(
	oldValues: Record<string, unknown>,
	newValues: Record<string, unknown>,
	excludeFields: string[]
): Array<{ field: string; oldValue: unknown; newValue: unknown }> {
	const changes: Array<{
		field: string;
		oldValue: unknown;
		newValue: unknown;
	}> = [];

	const allKeys = new Set([
		...Object.keys(oldValues),
		...Object.keys(newValues),
	]);

	for (const key of allKeys) {
		if (excludeFields.includes(key)) continue;

		const oldVal = oldValues[key];
		const newVal = newValues[key];

		const oldStr = formatValue(oldVal);
		const newStr = formatValue(newVal);

		if (oldStr !== newStr) {
			changes.push({ field: key, oldValue: oldVal, newValue: newVal });
		}
	}

	return changes;
}
