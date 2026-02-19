import { Text, type TextProps } from '@mantine/core';

export default function FiveDaysLogo({
	size = 'sm',
	fw = 500,
	inline = false,
}: TextProps & { inline?: boolean }) {
	return (
		<Text size={size} fw={fw} component={inline ? 'span' : undefined}>
			<Text component='span' fw={fw}>
				Five
			</Text>
			<Text component='span' fw={fw} c={'blue'}>
				Days
			</Text>
		</Text>
	);
}
