import { Button, Text } from '@react-email/components';
import BaseLayout from './BaseLayout';

type StatusAction = 'created' | 'updated' | 'approved' | 'rejected';

type StudentStatusEmailProps = {
	studentName: string;
	stdNo: string;
	statusType: string;
	action: StatusAction;
	reason?: string;
	approverName?: string;
	portalUrl: string;
};

const subjectMap: Record<StatusAction, (type: string) => string> = {
	created: (type) => `New Status Request: ${type}`,
	updated: (type) => `Status Request Updated: ${type}`,
	approved: (type) => `Status Request Approved: ${type}`,
	rejected: (type) => `Status Request Rejected: ${type}`,
};

function getBody(props: StudentStatusEmailProps): string {
	const { studentName, stdNo, statusType, action, approverName, reason } =
		props;

	switch (action) {
		case 'created':
			return `${studentName} (${stdNo}) has submitted a ${statusType} request.`;
		case 'updated':
			return `${studentName} (${stdNo}) has updated their ${statusType} request.`;
		case 'approved':
			return `Your ${statusType} request has been approved by ${approverName ?? 'an administrator'}.`;
		case 'rejected': {
			const base = `Your ${statusType} request has been rejected by ${approverName ?? 'an administrator'}.`;
			return reason ? `${base} Reason: ${reason}` : base;
		}
	}
}

const actionColors: Record<StatusAction, string> = {
	created: '#1a73e8',
	updated: '#f59e0b',
	approved: '#16a34a',
	rejected: '#dc2626',
};

export function getStudentStatusSubject(
	action: StatusAction,
	statusType: string
): string {
	return subjectMap[action](statusType);
}

export default function StudentStatusEmail(props: StudentStatusEmailProps) {
	const { action, statusType, portalUrl } = props;
	const subject = subjectMap[action](statusType);

	return (
		<BaseLayout previewText={subject}>
			<Text style={heading}>{subject}</Text>
			<Text style={bodyText}>{getBody(props)}</Text>
			<Button
				style={{ ...button, backgroundColor: actionColors[action] }}
				href={portalUrl}
			>
				View Details
			</Button>
		</BaseLayout>
	);
}

const heading: React.CSSProperties = {
	fontSize: '20px',
	fontWeight: 600,
	color: '#1f2937',
	margin: '0 0 16px',
};

const bodyText: React.CSSProperties = {
	fontSize: '14px',
	lineHeight: '24px',
	color: '#374151',
	margin: '0 0 24px',
};

const button: React.CSSProperties = {
	display: 'inline-block',
	borderRadius: '6px',
	color: '#ffffff',
	fontSize: '14px',
	fontWeight: 600,
	textDecoration: 'none',
	padding: '10px 24px',
};
