import { Card, Group, Stack, Text } from '@mantine/core';
import { IconBook2, IconBuilding, IconUsers } from '@tabler/icons-react';

interface RegistrationStatsProps {
	totalStudents: number;
	totalSchools: number;
	totalPrograms: number;
	termName: string;
}

export default function RegistrationStats({
	totalStudents,
	totalSchools,
	totalPrograms,
	termName,
}: RegistrationStatsProps) {
	return (
		<Group grow>
			<Card withBorder p="md">
				<Stack gap="xs" align="center">
					<IconUsers size={32} style={{ color: 'var(--mantine-color-blue-6)' }} />
					<Text size="xl" fw={700} c="blue">
						{totalStudents}
					</Text>
					<Text size="xs" c="dimmed" ta="center">
						Total Students
					</Text>
				</Stack>
			</Card>

			<Card withBorder p="md">
				<Stack gap="xs" align="center">
					<IconBuilding size={32} style={{ color: 'var(--mantine-color-green-6)' }} />
					<Text size="xl" fw={700} c="green">
						{totalSchools}
					</Text>
					<Text size="xs" c="dimmed" ta="center">
						Schools
					</Text>
				</Stack>
			</Card>

			<Card withBorder p="md">
				<Stack gap="xs" align="center">
					<IconBook2 size={32} style={{ color: 'var(--mantine-color-orange-6)' }} />
					<Text size="xl" fw={700} c="orange">
						{totalPrograms}
					</Text>
					<Text size="xs" c="dimmed" ta="center">
						Programs
					</Text>
				</Stack>
			</Card>

			<Card withBorder p="md" bg="gray.0">
				<Stack gap="xs" align="center">
					<Text size="xs" c="dimmed" fw={600}>
						TERM
					</Text>
					<Text size="sm" fw={600} ta="center">
						{termName}
					</Text>
					<Text size="xs" c="dimmed" ta="center">
						Current Selection
					</Text>
				</Stack>
			</Card>
		</Group>
	);
}
