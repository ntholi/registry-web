type IntakePeriodFees = {
	localApplicationFee: string;
	internationalApplicationFee: string;
};

export function resolveApplicationFee(
	intakePeriod: IntakePeriodFees,
	isMosotho: boolean | null
): string {
	if (isMosotho === false) {
		return intakePeriod.internationalApplicationFee;
	}
	return intakePeriod.localApplicationFee;
}
