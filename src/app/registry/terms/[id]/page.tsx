import { Badge } from '@mantine/core';
import { deleteTerm, getTerm } from '@registry/terms';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function TermDetails({ params }: Props) {
	const { id } = await params;
	const term = await getTerm(Number(id));

	if (!term) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={'Term'}
				queryKey={['terms']}
				handleDelete={async () => {
					'use server';
					await deleteTerm(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Code'>{term.code}</FieldView>
				<FieldView label='Semester'>{term.semester}</FieldView>
				<FieldView label='Is Active'>
					<Badge color={term.isActive ? 'green' : 'red'}>
						{term.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
