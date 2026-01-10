export const FINE_RATE = 1;

export function calculateFine(
	dueDate: Date,
	returnDate: Date
): { amount: number; daysOverdue: number } {
	const due = new Date(dueDate);
	const returned = new Date(returnDate);

	due.setHours(0, 0, 0, 0);
	returned.setHours(0, 0, 0, 0);

	const daysOverdue = Math.floor(
		(returned.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
	);

	if (daysOverdue <= 0) {
		return { amount: 0, daysOverdue: 0 };
	}

	return {
		amount: daysOverdue * FINE_RATE,
		daysOverdue,
	};
}
