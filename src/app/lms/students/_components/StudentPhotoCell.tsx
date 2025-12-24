'use client';

import StudentAvatar from '@lms/_shared/StudentAvatar';
import { Box } from '@mantine/core';

type StudentPhotoCellProps = {
	stdNo: number;
	name: string;
};

export default function StudentPhotoCell({
	stdNo,
	name,
}: StudentPhotoCellProps) {
	return (
		<Box display='flex' style={{ alignItems: 'center', gap: '8px' }}>
			<StudentAvatar
				stdNo={stdNo}
				name={name}
				size={32}
				radius='md'
				withPopover
			/>
		</Box>
	);
}
