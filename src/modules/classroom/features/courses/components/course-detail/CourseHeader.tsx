import { Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import type { Course } from '../../server/actions';

type Props = {
	course: Course;
};

function formatCourseState(state: string | null | undefined) {
	if (!state) return '';
	return state
		.toLowerCase()
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function formatUpdatedTime(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

export default function CourseHeader({ course }: Props) {
	const stateLabel = formatCourseState(course.courseState);
	const metadataBadges = [
		course.section ? `Section ${course.section}` : null,
		course.room ? `Room ${course.room}` : null,
		course.enrollmentCode ? `Code: ${course.enrollmentCode}` : null,
	].filter(Boolean) as string[];
	const updatedLabel = formatUpdatedTime(course.updateTime);

	return (
		<Paper withBorder radius='md' p='xl' shadow='xs'>
			<Stack gap='lg'>
				<Group justify='space-between' align='flex-start' wrap='wrap'>
					<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
						<Title order={1} size='h2' style={{ lineHeight: 1.2 }}>
							{course.name}
						</Title>
						{course.descriptionHeading && (
							<Text size='lg' c='dimmed' style={{ lineHeight: 1.4 }}>
								{course.descriptionHeading}
							</Text>
						)}
					</Stack>
					<Group gap='sm'>
						{stateLabel && (
							<Badge size='lg' variant='dot' color='blue'>
								{stateLabel}
							</Badge>
						)}
						{course.alternateLink && (
							<Button
								component='a'
								href={course.alternateLink}
								target='_blank'
								rel='noreferrer'
								variant='light'
								size='sm'
								rightSection={<IconExternalLink size='1rem' />}
							>
								Open in Classroom
							</Button>
						)}
					</Group>
				</Group>

				{(metadataBadges.length > 0 || updatedLabel) && (
					<Group gap='md' wrap='wrap'>
						{metadataBadges.map((item) => (
							<Badge key={item} variant='light' size='md' radius='sm'>
								{item}
							</Badge>
						))}
						{updatedLabel && (
							<Text size='sm' c='dimmed'>
								Updated {updatedLabel}
							</Text>
						)}
					</Group>
				)}
			</Stack>
		</Paper>
	);
}
