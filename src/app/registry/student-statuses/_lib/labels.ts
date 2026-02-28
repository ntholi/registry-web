const typeLabels: Record<string, string> = {
	withdrawal: 'Withdrawal',
	deferment: 'Deferment',
	reinstatement: 'Reinstatement',
};

const justificationLabels: Record<string, string> = {
	medical: 'Medical',
	transfer: 'Transfer',
	financial: 'Financial',
	employment: 'Employment',
	after_withdrawal: 'After Termination / Withdrawal',
	after_deferment: 'After Deferment',
	failed_modules: 'To Pick Up Failed Modules',
	upgrading: 'Upgrading Qualification',
	other: 'Other',
};

const approvalRoleLabels: Record<string, string> = {
	year_leader: 'Year Leader',
	program_leader: 'Programme Leader / Manager',
	student_services: 'Student Services (Counselling)',
	finance: 'Finance',
};

export function getTypeLabel(type: string) {
	return typeLabels[type] ?? type;
}

export function getJustificationLabel(justification: string) {
	return justificationLabels[justification] ?? justification;
}

export function getApprovalRoleLabel(role: string) {
	return approvalRoleLabels[role] ?? role;
}
