import type { reservationStatus } from '../_schema/reservations';

export type ReservationStatus = (typeof reservationStatus.enumValues)[number];

export type ReservationFilters = {
	status?: ReservationStatus;
	stdNo?: number;
};
