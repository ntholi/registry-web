import { Button, Text } from '@react-email/components';
import BaseLayout from './BaseLayout';

type ApplicationEmailProps = {
	applicantName: string;
	programName: string;
	accepted: boolean;
	rejectionReason?: string;
	portalUrl: string;
};

const subjectMap = {
	accepted: (program: string) => `Application Accepted: ${program}`,
	rejected: (program: string) => `Application Update: ${program}`,
};

export function getApplicationSubject(
	accepted: boolean,
	programName: string
): string {
	return accepted
		? subjectMap.accepted(programName)
		: subjectMap.rejected(programName);
}

export default function ApplicationEmail({
	applicantName,
	programName,
	accepted,
	rejectionReason,
	portalUrl,
}: ApplicationEmailProps) {
	const subject = getApplicationSubject(accepted, programName);
	const color = accepted ? '#16a34a' : '#dc2626';

	const body = accepted
		? `Dear ${applicantName}, we are pleased to inform you that your application to ${programName} has been accepted. Please log in to the portal for further instructions.`
		: `Dear ${applicantName}, after careful review, we regret to inform you that your application to ${programName} was not successful.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`;

	return (
		<BaseLayout previewText={subject}>
			<Text style={heading}>{subject}</Text>
			<Text style={bodyText}>{body}</Text>
			<Button style={{ ...button, backgroundColor: color }} href={portalUrl}>
				View Application
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
