import { Badge, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import type { ProgramWithSchool } from '@/app/admissions/entry-requirements';

interface CourseCardProps {
	program: ProgramWithSchool;
}

export default function CourseCard({ program }: CourseCardProps) {
	return (
		<Paper withBorder radius='lg' p='lg' h='100%'>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start'>
					<Stack gap={4}>
						<Text fw={600}>{program.name}</Text>
						<Text size='sm' c='dimmed'>
							{program.school.shortName}
						</Text>
					</Stack>
					<Badge variant='light'>{program.level}</Badge>
				</Group>

				<Divider />

				<Stack gap={6}>
					<Text size='sm' c='dimmed'>
						School
					</Text>
					<Group gap='xs'>
						<Text fw={500}>{program.school.name}</Text>
						<Badge variant='outline' color='gray'>
							{program.school.code}
						</Badge>
					</Group>
				</Stack>
			</Stack>
		</Paper>
	);
}
