import '@mantine/charts/styles.css';

import type { ReactNode } from 'react';

type Props = {
	children: ReactNode;
};

export default function ReportsLayout({ children }: Props) {
	return <>{children}</>;
}
