import {
	Box,
	Card,
	Center,
	Group,
	Stack,
	Text,
	ThemeIcon,
	Timeline,
	TimelineItem,
	Title,
} from '@mantine/core';
import { IconChecklist } from '@tabler/icons-react';

const steps = [
	{
		label: 'Create a task',
		desc: 'Add title, description, due date, and priority.',
	},
	{
		label: 'Assign it',
		desc: 'Assign a task to yourself, staff member or the whole department',
	},
	{ label: 'Track progress', desc: 'Move through statuses as work advances.' },
	{ label: 'Mark complete', desc: 'Close the task when the work is done.' },
];

export default function Page() {
	return (
		<Center h='100%' p='xl'>
			<Box maw={760} w='100%'>
				<Stack gap='xl'>
					<Stack gap='xs' ta='center'>
						<Group justify='center' mb={4}>
							<ThemeIcon size={64} radius='xl' variant='default'>
								<IconChecklist size={36} stroke={1.5} />
							</ThemeIcon>
						</Group>
						<Title order={2} fw={700}>
							Task Management
						</Title>
						<Text c='dimmed' size='sm' maw={480} mx='auto' lh={1.7}>
							A centralised workspace for creating, assigning, and tracking
							administrative tasks across staff and students. Keep work
							organised, prioritised, and visible to the right people.
						</Text>
					</Stack>

					<Card withBorder radius='md' p='lg' h='100%'>
						<Stack gap='md'>
							<Text fw={600} size='sm'>
								Workflow
							</Text>
							<Timeline active={-1} bulletSize={28} lineWidth={2}>
								{steps.map((step, i) => (
									<TimelineItem
										key={i}
										bullet={
											<Text size='xs' fw={700} c='violet'>
												{i + 1}
											</Text>
										}
									>
										<Text size='xs' fw={600} lh={1.4}>
											{step.label}
										</Text>
										<Text size='xs' c='dimmed' lh={1.5}>
											{step.desc}
										</Text>
									</TimelineItem>
								))}
							</Timeline>
						</Stack>
					</Card>
					<Group justify='center' c='dimmed' gap={4}>
						<Text size='xs'>
							Select a task from the list or create a new one to get started
						</Text>
					</Group>
				</Stack>
			</Box>
		</Center>
	);
}
