import { Text, Title } from '@mantine/core';
import type { classroom_v1 } from 'googleapis';
import CourseWorkBreadcrumbs from './CourseWorkBreadcrumbs';

type Props = {
	courseWork: classroom_v1.Schema$CourseWork;
	title?: string | null;
};

export default function Heading({ courseWork, title }: Props) {
	if (!title) title = courseWork.title;
	return (
		<>
			<CourseWorkBreadcrumbs
				courseId={courseWork.courseId}
				courseWorkId={courseWork.id}
			/>
			<Title mt={'lg'}>{title}</Title>
			<div>
				<Text tt='capitalize'>
					{courseWork.workType?.toLowerCase()}
					<Text component={'span'} c='dimmed' size='sm'>
						&nbsp; ({courseWork.maxPoints} Points)
					</Text>
				</Text>
				<Text size='sm' c='dimmed'>
					Due: {formatDate(courseWork.dueDate, courseWork.dueTime)}
				</Text>
				<Text tt='capitalize' size='sm' c='dimmed'>
					{courseWork.state?.toLocaleLowerCase()}
				</Text>
			</div>
		</>
	);
}

function formatDate(
	dueDate: classroom_v1.Schema$CourseWork['dueDate'],
	dueTime: classroom_v1.Schema$CourseWork['dueTime']
): string {
	if (!dueDate) return 'No due date';
	const date = new Date(
		dueDate.year!,
		dueDate.month! - 1,
		dueDate.day!,
		dueTime?.hours || 0,
		dueTime?.minutes || 0
	);
	return date.toLocaleString();
}
