import { notFound } from 'next/navigation';
import AutoApprovalForm from '../../_components/Form';
import { getAutoApproval } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditAutoApprovalPage({ params }: Props) {
	const { id } = await params;
	const rule = await getAutoApproval(Number.parseInt(id, 10));

	if (!rule) {
		return notFound();
	}

	return (
		<AutoApprovalForm
			rule={{
				id: rule.id,
				stdNo: rule.stdNo,
				termId: rule.termId,
				department: rule.department,
			}}
		/>
	);
}
