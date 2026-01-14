import { schools } from '@academic/_database';
import {
	venueSchools,
	venues,
	venueTypes,
} from '@timetable/_database/schema/venues';
import { inArray } from 'drizzle-orm';
import { db } from '../index';

const VENUE_TYPES = [
	{ name: 'Lecture Room' },
	{ name: 'Lecture Hall' },
	{ name: 'Mac Lab' },
	{ name: 'Multimedia Lab' },
	{ name: 'Networking Lab' },
	{ name: 'Computer Workshop' },
];

type VenueTypeName = (typeof VENUE_TYPES)[number]['name'];

const VENUES: { name: string; capacity: number; type: VenueTypeName }[] = [
	{ name: 'Hall 6', capacity: 70, type: 'Lecture Hall' },
	{ name: 'Hall 9', capacity: 100, type: 'Lecture Hall' },
	{ name: 'Hall 10', capacity: 70, type: 'Lecture Hall' },
	{ name: 'Room 1', capacity: 50, type: 'Lecture Room' },
	{ name: 'Room 4', capacity: 50, type: 'Lecture Room' },
	{ name: 'Room 6', capacity: 50, type: 'Lecture Room' },
	{ name: 'Room 9', capacity: 50, type: 'Lecture Room' },
	{ name: 'Room 10', capacity: 50, type: 'Lecture Room' },
	{ name: 'Room 11', capacity: 50, type: 'Lecture Room' },
	{ name: 'Room 13', capacity: 50, type: 'Lecture Room' },
	{ name: 'Room 14', capacity: 50, type: 'Lecture Room' },
	{ name: 'Mac Lab', capacity: 40, type: 'Mac Lab' },
	{ name: 'Net Lab', capacity: 40, type: 'Networking Lab' },
	{ name: 'Workshop', capacity: 40, type: 'Computer Workshop' },
	{ name: 'MM1', capacity: 40, type: 'Multimedia Lab' },
	{ name: 'MM2', capacity: 40, type: 'Multimedia Lab' },
	{ name: 'MM3', capacity: 40, type: 'Multimedia Lab' },
	{ name: 'MM4', capacity: 40, type: 'Multimedia Lab' },
	{ name: 'MM5', capacity: 40, type: 'Multimedia Lab' },
	{ name: 'MM6', capacity: 40, type: 'Multimedia Lab' },
	{ name: 'MM7', capacity: 40, type: 'Multimedia Lab' },
	{ name: 'MM10', capacity: 40, type: 'Multimedia Lab' },
];

const VENUE_SCHOOL_ASSOCIATIONS: { venue: string; schools: string[] }[] = [
	{ venue: 'Room 1', schools: ['FICT'] },
	{ venue: 'Hall 6', schools: ['FICT'] },
	{ venue: 'Net Lab', schools: ['FICT'] },
	{ venue: 'Workshop', schools: ['FICT'] },
	{ venue: 'MM1', schools: ['FICT'] },
	{ venue: 'MM2', schools: ['FICT'] },
	{ venue: 'MM3', schools: ['FICT'] },
	{ venue: 'MM4', schools: ['FICT'] },
	{ venue: 'MM5', schools: ['FICT'] },
	{ venue: 'MM6', schools: ['FICT'] },
	{ venue: 'MM7', schools: ['FICT'] },

	{ venue: 'Room 4', schools: ['FBMG'] },
	{ venue: 'Room 6', schools: ['FBMG'] },

	{ venue: 'Mac Lab', schools: ['FDI', 'FFLD'] },
	{ venue: 'MM10', schools: ['FDI', 'FFLD'] },

	{ venue: 'Room 13', schools: ['FFTB', 'FCM'] },
	{ venue: 'Room 14', schools: ['FFTB', 'FCM'] },
	{ venue: 'Room 10', schools: ['FFTB', 'FCM'] },
	{ venue: 'Room 9', schools: ['FFTB', 'FCM'] },
	{ venue: 'Room 11', schools: ['FFTB', 'FCM'] },
	{ venue: 'Hall 9', schools: ['FFTB', 'FCM'] },
	{ venue: 'Hall 10', schools: ['FFTB', 'FCM'] },
];

export async function seedVenues() {
	console.log('🌱 Seeding venues and venue types...');

	await db.insert(venueTypes).values(VENUE_TYPES).onConflictDoNothing();

	const existingTypes = await db.select().from(venueTypes);
	const typeMap = new Map(existingTypes.map((t) => [t.name, t.id]));

	const venuesToInsert = VENUES.map((v) => {
		const typeId = typeMap.get(v.type);
		if (!typeId) {
			throw new Error(`Venue type "${v.type}" not found for venue "${v.name}"`);
		}
		return {
			name: v.name,
			capacity: v.capacity,
			typeId,
		};
	});

	await db.insert(venues).values(venuesToInsert).onConflictDoNothing();

	const existingVenues = await db.select().from(venues);
	const venueMap = new Map(existingVenues.map((v) => [v.name, v.id]));

	const existingSchools = await db
		.select()
		.from(schools)
		.where(
			inArray(
				schools.code,
				Array.from(new Set(VENUE_SCHOOL_ASSOCIATIONS.flatMap((a) => a.schools)))
			)
		);
	const schoolMap = new Map(existingSchools.map((s) => [s.code, s.id]));

	const associations: { venueId: number; schoolId: number }[] = [];

	for (const assoc of VENUE_SCHOOL_ASSOCIATIONS) {
		const venueId = venueMap.get(assoc.venue);
		if (!venueId) {
			console.warn(`⚠️ Venue "${assoc.venue}" not found for association.`);
			continue;
		}

		for (const schoolCode of assoc.schools) {
			const schoolId = schoolMap.get(schoolCode);
			if (schoolId) {
				associations.push({ venueId, schoolId });
			} else {
				console.warn(`⚠️ School "${schoolCode}" not found for association.`);
			}
		}
	}

	if (associations.length > 0) {
		await db.insert(venueSchools).values(associations).onConflictDoNothing();
	}

	console.log(
		`✅ Seeded ${VENUES.length} venues and ${associations.length} associations.`
	);
}
