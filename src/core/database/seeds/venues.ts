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

	await db.insert(venueTypes).values(lectureRoomType).onConflictDoNothing();

	const [type] = await db
		.select()
		.from(venueTypes)
		.where(eq(venueTypes.name, 'Lecture Room'))
		.limit(1);

	if (!type) {
		console.error('❌ Failed to find or create venue type: Lecture Room');
		return;
	}

	const venueData = [
		{ name: 'Room 1', capacity: 50, typeId: type.id },
		{ name: 'Room 4', capacity: 50, typeId: type.id },
		{ name: 'Room 6', capacity: 50, typeId: type.id },
	];

	await db.insert(venues).values(venueData).onConflictDoNothing();

	const schoolCodes = ['FICT', 'FBMG'];
	const foundSchools = await db
		.select()
		.from(schools)
		.where(inArray(schools.code, schoolCodes));

	const fict = foundSchools.find((s) => s.code === 'FICT');
	const fbmg = foundSchools.find((s) => s.code === 'FBMG');

	if (!fict || !fbmg) {
		console.warn('⚠️ Missing schools FICT or FBMG. Seed might be incomplete.');
	}

	const seededVenues = await db
		.select()
		.from(venues)
		.where(inArray(venues.name, ['Room 1', 'Room 4', 'Room 6']));

	const schoolAssociations = [];

	const room1 = seededVenues.find((v) => v.name === 'Room 1');
	const room4 = seededVenues.find((v) => v.name === 'Room 4');
	const room6 = seededVenues.find((v) => v.name === 'Room 6');

	if (room1 && fict) {
		schoolAssociations.push({ venueId: room1.id, schoolId: fict.id });
	}

	if (room4 && fbmg) {
		schoolAssociations.push({ venueId: room4.id, schoolId: fbmg.id });
	}

	if (room6 && fbmg) {
		schoolAssociations.push({ venueId: room6.id, schoolId: fbmg.id });
	}

	if (schoolAssociations.length > 0) {
		await db
			.insert(venueSchools)
			.values(schoolAssociations)
			.onConflictDoNothing();
	}

	console.log(`✅ Seeded ${venueData.length} venues and school associations.`);
}
