import { notFound } from 'next/navigation';
import ApplicationForm from '../../_components/Form';
import { getApplication, updateApplication } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditApplicationPage({ params }: Props) {
	const { id } = await params;
	const item = await getApplication(Number(id));

	if (!item) {
		return notFound();
	}

	return (
		<ApplicationForm
			title='Edit Application'
			defaultValues={item}
			onSubmit={async (values) => {
				'use server';
				return updateApplication(Number(id), values);
			}}
		/>
	);
}
