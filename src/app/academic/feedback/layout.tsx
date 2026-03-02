import '@mantine/charts/styles.css';

import type { ReactNode } from 'react';

type Props = {
	children: ReactNode;
};

export default function FeedbackLayout({ children }: Props) {
	return <>{children}</>;
}
