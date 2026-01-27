import { notFound } from 'next/navigation';
import AutoApprovalRuleForm from '../../_components/Form';
import { getAutoApprovalRule } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditAutoApprovalRulePage({ params }: Props) {
	const { id } = await params;
	const rule = await getAutoApprovalRule(Number.parseInt(id, 10));

	if (!rule) {
		return notFound();
	}

	return (
		<AutoApprovalRuleForm
			rule={{
				id: rule.id,
				stdNo: rule.stdNo,
				termId: rule.termId,
				department: rule.department,
			}}
		/>
	);
}
