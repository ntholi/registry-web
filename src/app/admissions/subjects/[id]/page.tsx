import { Badge, List, ListItem, Paper, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import type { SubjectWithAliases } from '../_lib/types';
import { deleteSubject, getSubject } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function SubjectDetails({ params }: Props) {
	const { id } = await params;
	const item = (await getSubject(Number(id))) as SubjectWithAliases | null;

	if (!item) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Subject'
				queryKey={['subjects']}
				handleDelete={async () => {
					'use server';
					await deleteSubject(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{item.name}</FieldView>
				<FieldView label='Status'>
					<Badge color={item.isActive ? 'green' : 'gray'}>
						{item.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</FieldView>
				<Paper withBorder p='md'>
					<Text fw={500} size='sm' mb='xs'>
						Aliases
					</Text>
					{item.aliases?.length > 0 ? (
						<List size='sm' spacing='xs'>
							{item.aliases.map((a) => (
								<ListItem key={a.id}>{a.alias}</ListItem>
							))}
						</List>
					) : (
						<Text size='sm' c='dimmed' fs='italic'>
							No aliases
						</Text>
					)}
				</Paper>
			</DetailsViewBody>
		</DetailsView>
	);
}
