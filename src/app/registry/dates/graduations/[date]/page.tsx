import {
	deleteGraduation,
	getGraduationByDate,
} from '@registry/dates/graduations';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';

type Props = {
	params: Promise<{ date: string }>;
};

export default async function GraduationDetails({ params }: Props) {
	const { date } = await params;
	const graduation = await getGraduationByDate(date);

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
					await deleteGraduation(graduation.id);
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
