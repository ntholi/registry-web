import {
	Badge,
	Box,
	Divider,
	Group,
	List,
	ListItem,
	Paper,
	Text,
} from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import MakeAliasModal from '../_components/MakeAliasModal';
import type { SubjectWithAliases } from '../_lib/types';
import { deleteSubject, getSubject } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function SubjectDetails({ params }: Props) {
	const { id } = await params;
	const item = (await getSubject(id)) as SubjectWithAliases | null;

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
					await deleteSubject(id);
				}}
			/>
			<DetailsViewBody>
				<Box>
					<Group justify='space-between' align='start'>
						<FieldView underline={false} label='Name'>
							{item.name}
						</FieldView>
						<MakeAliasModal subjectId={item.id} subjectName={item.name} />
					</Group>
					<Divider />
				</Box>
				<FieldView label='LQF Level'>
					{item.lqfLevel ? `Level ${item.lqfLevel}` : 'Not set'}
				</FieldView>
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
