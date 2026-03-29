type Placeholder = { token: string; label: string };

type PlaceholderGroup = {
	group: string;
	items: readonly Placeholder[];
};

export const PLACEHOLDER_GROUPS: readonly PlaceholderGroup[] = [
	{
		group: 'Student',
		items: [
			{ token: 'studentName', label: 'Full Name' },
			{ token: 'stdNo', label: 'Student Number' },
		],
	},
	{
		group: 'Status',
		items: [
			{ token: 'statusType', label: 'Status Type' },
			{ token: 'reason', label: 'Reason' },
			{ token: 'approverName', label: 'Approver Name' },
		],
	},
	{
		group: 'Clearance',
		items: [
			{ token: 'department', label: 'Department' },
			{ token: 'clearanceType', label: 'Clearance Type' },
		],
	},
	{
		group: 'Notification',
		items: [
			{ token: 'title', label: 'Notification Title' },
			{ token: 'message', label: 'Notification Message' },
			{ token: 'senderName', label: 'Sender Name' },
		],
	},
	{
		group: 'General',
		items: [
			{ token: 'portalUrl', label: 'Portal URL' },
			{ token: 'currentDate', label: 'Current Date' },
		],
	},
] as const;

export const PLACEHOLDERS = PLACEHOLDER_GROUPS.flatMap((g) => g.items);

export type PlaceholderToken = (typeof PLACEHOLDERS)[number]['token'];

export function resolveMailTemplate(
	html: string,
	params: Record<string, string | null | undefined>
): string {
	return html.replace(
		/\{\{(\w+)\}\}/g,
		(_, token) => params[token] ?? `{{${token}}}`
	);
}
