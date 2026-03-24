import { Button, Text } from '@react-email/components';
import parse from 'html-react-parser';
import BaseLayout from './BaseLayout';

type GenericEmailProps = {
	heading: string;
	body: string;
	ctaText?: string;
	ctaUrl?: string;
};

export default function GenericEmail(props: GenericEmailProps) {
	return (
		<BaseLayout previewText={props.heading}>
			<Text style={headingStyle}>{props.heading}</Text>
			<div style={bodyStyle}>{parse(props.body)}</div>
			{props.ctaText && props.ctaUrl && (
				<Button style={button} href={props.ctaUrl}>
					{props.ctaText}
				</Button>
			)}
		</BaseLayout>
	);
}

const headingStyle: React.CSSProperties = {
	fontSize: '20px',
	fontWeight: 600,
	color: '#1f2937',
	margin: '0 0 16px',
};

const bodyStyle: React.CSSProperties = {
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
