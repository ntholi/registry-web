import { Box } from '@mantine/core';
import type React from 'react';

type Props = {
	children: React.ReactNode;
};

export default function layout({ children }: Props) {
	return <Box px="xl">{children}</Box>;
}
