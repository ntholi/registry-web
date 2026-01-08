import { notFound } from 'next/navigation';
import IntakePeriodForm from '../../_components/Form';
import { getIntakePeriod, updateIntakePeriod } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditIntakePeriodPage({ params }: Props) {
	const { id } = await params;
	const item = await getIntakePeriod(Number(id));

	if (!item) {
		return notFound();
	}

	return (
		<IntakePeriodForm
			title='Edit Intake Period'
			defaultValues={item}
			onSubmit={async (values) => {
				'use server';
				return updateIntakePeriod(Number(id), values);
			}}
		/>
	);
}
