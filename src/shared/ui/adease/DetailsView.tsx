import { Box, type BoxProps } from '@mantine/core';

export interface DetailsViewProps extends BoxProps {
	children: React.ReactNode;
}

export function DetailsView({ children, ...props }: DetailsViewProps) {
	return (
		<Box p={{ base: 'xs', sm: 'md', md: 'xl' }} {...props}>
			{children}
		</Box>
	);
}
