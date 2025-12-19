import { Badge } from '@mantine/core';
import { deleteTerm, getTermByCode } from '@registry/dates/terms';
import { getBooleanColor } from '@student-portal/utils';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';

type Props = {
	params: Promise<{ code: string }>;
};

export default async function TermDetails({ params }: Props) {
	const { code } = await params;
	const term = await getTermByCode(code);

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
					await deleteTerm(term.id);
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Code'>{term.code}</FieldView>
				<FieldView label='Name'>{term.name}</FieldView>
				<FieldView label='Year'>{term.year}</FieldView>
				<FieldView label='Start Date'>{term.startDate}</FieldView>
				<FieldView label='End Date'>{term.endDate}</FieldView>
				<FieldView label='Semester'>{term.semester}</FieldView>
				<FieldView label='Is Active'>
					<Badge color={getBooleanColor(term.isActive)}>
						{term.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
