import { Group, Text } from '@mantine/core';
import { Fragment } from 'react';
import Link from '@/components/Link';

type Prerequisite = {
	id: number;
	prerequisite: {
		id: number;
		createdAt?: Date | null;
		moduleId?: number | null;
		type?: string;
		credits?: number;
		semesterId?: number | null;
		hidden?: boolean;
		module?: {
			id: number;
			code: string;
			name: string;
		} | null;
	};
};

type Props = {
	prerequisites: Prerequisite[];
	hidden: boolean;
};

export default function PrerequisiteDisplay({ prerequisites, hidden }: Props) {
	if (!prerequisites || prerequisites.length === 0) {
		return (
			<Text size='sm' c='dimmed'>
				None
			</Text>
		);
	}

	return (
		<Group gap={'xs'}>
			{prerequisites.map((it, i) => (
				<Fragment key={it.id}>
					<Group gap={'xs'}>
						<Link
							c={hidden ? 'dark' : undefined}
							href={`/dashboard/semester-modules/${it.prerequisite.id}`}
							size='0.8rem'
						>
							{it.prerequisite.module?.code}
						</Link>
						<Text size='0.8rem'>{it.prerequisite.module?.name}</Text>
					</Group>
					{prerequisites.length > 1 && i < prerequisites.length - 1 && ','}
				</Fragment>
			))}
		</Group>
	);
}
