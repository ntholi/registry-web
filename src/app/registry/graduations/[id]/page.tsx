import { deleteGraduation, getGraduation } from '@registry/graduations';
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

export default async function GraduationDetails({ params }: Props) {
	const { id } = await params;
	const graduation = await getGraduation(Number(id));

	if (!graduation) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={'Graduation'}
				queryKey={['graduations']}
				handleDelete={async () => {
					'use server';
					await deleteGraduation(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Graduation Date'>
					{graduation.graduationDate}
				</FieldView>
				<FieldView label='Term'>{graduation.term?.code}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
