'use client';

import { Box } from '@mantine/core';
import StudentAvatar from '@/modules/lms/shared/StudentAvatar';

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
