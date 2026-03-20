import { Button, Text } from '@react-email/components';
import BaseLayout from './BaseLayout';

type NotificationEmailProps = {
	title: string;
	message: string;
	link?: string;
	senderName?: string;
};

export default function NotificationEmail({
	title,
	message,
	link,
	senderName,
}: NotificationEmailProps) {
	return (
		<BaseLayout previewText={title}>
			<Text style={heading}>{title}</Text>
			{senderName && <Text style={sender}>From: {senderName}</Text>}
			<Text style={bodyText}>{message}</Text>
			{link && (
				<Button style={button} href={link}>
					View in Portal
				</Button>
			)}
		</BaseLayout>
	);
}

const heading: React.CSSProperties = {
	fontSize: '20px',
	fontWeight: 600,
	color: '#1f2937',
	margin: '0 0 8px',
};

const sender: React.CSSProperties = {
	fontSize: '13px',
	color: '#6b7280',
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
	backgroundColor: '#1a73e8',
	borderRadius: '6px',
	color: '#ffffff',
	fontSize: '14px',
	fontWeight: 600,
	textDecoration: 'none',
	padding: '10px 24px',
};
