'use client';

import { FieldView } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';

type Props = {
	stdNo: number;
	name: string;
	label?: string;
	underline?: boolean;
};

export default function StudentNameView({
	stdNo,
	name,
	underline = false,
	...rest
}: Props) {
	return (
		<FieldView {...rest} label={rest.label ?? 'Student'} underline={underline}>
			<Link href={`/registry/students/${stdNo}`} size='sm' fw={500}>
				{name} ({stdNo})
			</Link>
		</FieldView>
	);
}
