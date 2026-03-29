import { Button, Text } from '@react-email/components';
import BaseLayout from './BaseLayout';

type ClearanceType = 'registration' | 'graduation';

type ClearanceEmailProps = {
	studentName: string;
	stdNo: string;
	department: string;
	approved: boolean;
	clearanceType: ClearanceType;
	reason?: string;
	portalUrl: string;
};

const typeLabels: Record<ClearanceType, string> = {
	registration: 'Registration',
	graduation: 'Graduation',
};

export function getClearanceSubject(
	approved: boolean,
	clearanceType: ClearanceType,
	department: string
): string {
	const typeLabel = typeLabels[clearanceType];
	return approved
		? `${typeLabel} Clearance Approved: ${department}`
		: `${typeLabel} Clearance Rejected: ${department}`;
}

export default function ClearanceEmail({
	studentName,
	stdNo,
	department,
	approved,
	clearanceType,
	reason,
	portalUrl,
}: ClearanceEmailProps) {
	const subject = getClearanceSubject(approved, clearanceType, department);
	const color = approved ? '#16a34a' : '#dc2626';
	const typeLabel = typeLabels[clearanceType];

	const body = approved
		? `Dear ${studentName} (${stdNo}), your ${typeLabel.toLowerCase()} clearance from ${department} has been approved.`
		: `Dear ${studentName} (${stdNo}), your ${typeLabel.toLowerCase()} clearance from ${department} has been rejected.${reason ? ` Reason: ${reason}` : ''}`;

	return (
		<BaseLayout previewText={subject}>
			<Text style={heading}>{subject}</Text>
			<Text style={bodyText}>{body}</Text>
			<Button style={{ ...button, backgroundColor: color }} href={portalUrl}>
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
