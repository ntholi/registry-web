type IntakePeriodFees = {
	localApplicationFee: string;
	internationalApplicationFee: string;
};

export function resolveApplicationFee(
	intakePeriod: IntakePeriodFees,
	nationality: string | null
): string {
	const value = nationality?.trim().toLowerCase();
	if (value !== 'lesotho') {
		return intakePeriod.internationalApplicationFee;
	}
	return intakePeriod.localApplicationFee;
}
