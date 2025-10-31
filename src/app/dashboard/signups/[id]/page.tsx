import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewBody, DetailsViewHeader, FieldView } from '@/components/adease';
import { deleteSignup, getSignup } from '@/server/signups/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function SignupDetails({ params }: Props) {
	const { id } = await params;
	const signup = await getSignup(id);

	if (!signup) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={'Signup'}
				queryKey={['signups']}
				handleDelete={async () => {
					'use server';
					await deleteSignup(id);
				}}
			/>
			<DetailsViewBody>
				<FieldView label='User Id'>{signup.userId}</FieldView>
				<FieldView label='Name'>{signup.name}</FieldView>
				<FieldView label='Std No'>{signup.stdNo}</FieldView>
				<FieldView label='Message'>{signup.message}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
