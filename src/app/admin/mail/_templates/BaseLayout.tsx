import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from '@react-email/components';
import type { ReactNode } from 'react';
import { getPublicUrl } from '@/core/integrations/storage-utils';

const LOGO_KEY = 'branding/logo.png';

type BaseLayoutProps = {
	previewText: string;
	children: ReactNode;
};

export default function BaseLayout({ previewText, children }: BaseLayoutProps) {
	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={body}>
				<Container style={container}>
					<Section style={header}>
						<Img
							src={getPublicUrl(LOGO_KEY)}
							width='48'
							height='48'
							alt='Limkokwing University'
							style={logo}
						/>
						<Text style={headerTitle}>
							Limkokwing University of Creative Technology
						</Text>
					</Section>

					<Section style={content}>{children}</Section>

					<Hr style={divider} />

					<Section style={footer}>
						<Text style={footerText}>
							© {new Date().getFullYear()} Limkokwing University of Creative
							Technology — Lesotho
						</Text>
						<Text style={footerNote}>
							This is an automated email from the Registry Portal. Do not reply
							to this email.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

const body: React.CSSProperties = {
	backgroundColor: '#f6f9fc',
	fontFamily: 'Arial, Helvetica, sans-serif',
	margin: 0,
	padding: 0,
};

const container: React.CSSProperties = {
	maxWidth: '600px',
	margin: '0 auto',
	padding: '20px 0 48px',
};

const header: React.CSSProperties = {
	textAlign: 'center' as const,
	padding: '24px 0 16px',
};

const logo: React.CSSProperties = {
	margin: '0 auto',
};

const headerTitle: React.CSSProperties = {
	fontSize: '16px',
	fontWeight: 600,
	color: '#1a73e8',
	margin: '12px 0 0',
};

const content: React.CSSProperties = {
	backgroundColor: '#ffffff',
	borderRadius: '8px',
	padding: '32px 24px',
	border: '1px solid #e8edf2',
};

const divider: React.CSSProperties = {
	borderColor: '#e8edf2',
	margin: '24px 0',
};

const footer: React.CSSProperties = {
	textAlign: 'center' as const,
	padding: '0 24px',
};

const footerText: React.CSSProperties = {
	fontSize: '12px',
	color: '#8898aa',
	margin: '0 0 4px',
};

const footerNote: React.CSSProperties = {
	fontSize: '11px',
	color: '#aab7c4',
	margin: 0,
};
