import { schools } from '@academic/_database';
import {
	venueSchools,
	venues,
	venueTypes,
} from '@timetable/_database/schema/venues';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../index';

export async function seedVenues() {
	console.log('🌱 Seeding venues and venue types...');

	const lectureRoomType = {
		name: 'Lecture Room',
		description: 'A room used for lectures and formal instructional sessions.',
	};

	const lectureHallType = {
		name: 'Lecture Hall',
		description:
			'A large room used for lectures and formal instructional sessions.',
	};

	await db
		.insert(venueTypes)
		.values([lectureRoomType, lectureHallType])
		.onConflictDoNothing();

	const [type] = await db
		.select()
		.from(venueTypes)
		.where(eq(venueTypes.name, 'Lecture Room'))
		.limit(1);

	const [hallType] = await db
		.select()
		.from(venueTypes)
		.where(eq(venueTypes.name, 'Lecture Hall'))
		.limit(1);

	if (!type || !hallType) {
		console.error('❌ Failed to find or create venue types');
		return;
	}

	const venueData = [
		{ name: 'Room 1', capacity: 50, typeId: type.id },
		{ name: 'Room 4', capacity: 50, typeId: type.id },
		{ name: 'Room 6', capacity: 50, typeId: type.id },
		{ name: 'Hall 6', capacity: 100, typeId: hallType.id },
		{ name: 'Room 13', capacity: 50, typeId: type.id },
		{ name: 'Room 14', capacity: 50, typeId: type.id },
		{ name: 'Room 10', capacity: 50, typeId: type.id },
		{ name: 'Room 9', capacity: 50, typeId: type.id },
		{ name: 'Room 11', capacity: 50, typeId: type.id },
		{ name: 'Hall 9', capacity: 100, typeId: hallType.id },
		{ name: 'Hall 10', capacity: 100, typeId: hallType.id },
	];

	await db.insert(venues).values(venueData).onConflictDoNothing();

	const schoolCodes = ['FICT', 'FBMG', 'FFTB', 'FCM'];
	const foundSchools = await db
		.select()
		.from(schools)
		.where(inArray(schools.code, schoolCodes));

	const fict = foundSchools.find((s) => s.code === 'FICT');
	const fbmg = foundSchools.find((s) => s.code === 'FBMG');
	const fftb = foundSchools.find((s) => s.code === 'FFTB');
	const fcm = foundSchools.find((s) => s.code === 'FCM');

	if (!fict || !fbmg || !fftb || !fcm) {
		console.warn('⚠️ Some schools were not found. Seed might be incomplete.');
	}

	const seededVenues = await db.select().from(venues);

	const venueMap = new Map(seededVenues.map((v) => [v.name, v]));
	const schoolAssociations: (typeof venueSchools.$inferInsert)[] = [];

	const addAssociation = (
		venueName: string,
		school?: typeof schools.$inferSelect
	) => {
		const venue = venueMap.get(venueName);
		if (venue && school) {
			schoolAssociations.push({ venueId: venue.id, schoolId: school.id });
		}
	};

	addAssociation('Room 1', fict);
	addAssociation('Hall 6', fict);
	addAssociation('Room 4', fbmg);
	addAssociation('Room 6', fbmg);

	const fftbFcmVenues = [
		'Room 13',
		'Room 14',
		'Room 10',
		'Room 9',
		'Room 11',
		'Hall 9',
		'Hall 10',
	];

	for (const name of fftbFcmVenues) {
		addAssociation(name, fftb);
		addAssociation(name, fcm);
	}

	if (schoolAssociations.length > 0) {
		await db
			.insert(venueSchools)
			.values(schoolAssociations)
			.onConflictDoNothing();
	}

	console.log(`✅ Seeded ${venueData.length} venues and school associations.`);
}
