import type { ReactNode } from 'react';

export const metadata = {
	title: 'Student Feedback',
	description: 'Provide anonymous feedback on your lecturers',
};

export default function FeedbackLayout({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
