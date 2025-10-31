import { Divider, Flex, Group, rem, Text } from '@mantine/core';

type Props = {
	gpa: number;
	cgpa: number;
};

export default function GpaDisplay({ gpa, cgpa }: Props) {
	const gpaColor = gpa >= 3 ? 'green' : gpa >= 2 ? 'yellow' : 'red';
	const cgpaColor = cgpa >= 3 ? 'blue' : cgpa >= 2 ? 'orange' : 'red';

	return (
		<Flex gap='md' align='center'>
			<Group gap={5} align='baseline'>
				<Text size={rem(10)} c='dimmed' fw={500} tt='uppercase' style={{ letterSpacing: '0.5px' }}>
					GPA
				</Text>
				<Text size='sm' fw={600} c={gpaColor}>
					{gpa.toFixed(2)}
				</Text>
			</Group>

			<Divider orientation='vertical' size='xs' />

			<Group gap={5} align='baseline'>
				<Text size={rem(10)} c='dimmed' fw={500} tt='uppercase' style={{ letterSpacing: '0.5px' }}>
					CGPA
				</Text>
				<Text size='sm' fw={600} c={cgpaColor}>
					{cgpa.toFixed(2)}
				</Text>
			</Group>
		</Flex>
	);
}
