import { Anchor, Breadcrumbs } from '@mantine/core';
import Link from 'next/link';
import { Suspense } from 'react';
import CourseLink from './CourseLink';
import CourseWorkLink from './CourseWorkLink';

type Props = {
	courseId?: string | null;
	courseWorkId?: string | null;
};

export default function CourseWorkBreadcrumbs({
	courseId,
	courseWorkId,
}: Props) {
	const items = [
		<Anchor component={Link} href={'/courses'} key={1}>
			Courses
		</Anchor>,
		<Suspense fallback={<div>Course</div>} key={2}>
			<CourseLink courseId={courseId} />
		</Suspense>,
		<Suspense fallback={<div>Assessment</div>} key={2}>
			<CourseWorkLink courseId={courseId} courseWorkId={courseWorkId} />
		</Suspense>,
	];

	return <Breadcrumbs>{items}</Breadcrumbs>;
}
