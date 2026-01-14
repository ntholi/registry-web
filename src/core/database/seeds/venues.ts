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

	const macLabType = {
		name: 'Mac Lab',
		description: 'A laboratory equipped with Apple Macintosh computers.',
	};

	const multimediaLabType = {
		name: 'Multimedia Lab',
		description:
			'A laboratory equipped for multimedia production and digital media training.',
	};

	const networkingLabType = {
		name: 'Networking Lab',
		description:
			'A laboratory equipped for networking and telecommunications training.',
	};

	const computerWorkshopType = {
		name: 'Computer Workshop',
		description: 'A workshop for computer hardware and maintenance.',
	};

	await db
		.insert(venueTypes)
		.values([
			lectureRoomType,
			lectureHallType,
			macLabType,
			multimediaLabType,
			networkingLabType,
			computerWorkshopType,
		])
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

	const [macType] = await db
		.select()
		.from(venueTypes)
		.where(eq(venueTypes.name, 'Mac Lab'))
		.limit(1);

	const [mmType] = await db
		.select()
		.from(venueTypes)
		.where(eq(venueTypes.name, 'Multimedia Lab'))
		.limit(1);

	const [netType] = await db
		.select()
		.from(venueTypes)
		.where(eq(venueTypes.name, 'Networking Lab'))
		.limit(1);

	const [workshopType] = await db
		.select()
		.from(venueTypes)
		.where(eq(venueTypes.name, 'Computer Workshop'))
		.limit(1);

	if (!type || !hallType || !macType || !mmType || !netType || !workshopType) {
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
		{ name: 'Mac Lab', capacity: 40, typeId: macType.id },
		{ name: 'MM1', capacity: 40, typeId: mmType.id },
		{ name: 'MM2', capacity: 40, typeId: mmType.id },
		{ name: 'MM3', capacity: 40, typeId: mmType.id },
		{ name: 'MM4', capacity: 40, typeId: mmType.id },
		{ name: 'MM5', capacity: 40, typeId: mmType.id },
		{ name: 'MM6', capacity: 40, typeId: mmType.id },
		{ name: 'MM7', capacity: 40, typeId: mmType.id },
		{ name: 'MM10', capacity: 40, typeId: mmType.id },
		{ name: 'Net Lab', capacity: 40, typeId: netType.id },
		{ name: 'Workshop', capacity: 40, typeId: workshopType.id },
	];

	await db.insert(venues).values(venueData).onConflictDoNothing();

	const schoolCodes = ['FICT', 'FBMG', 'FFTB', 'FCM', 'FDI', 'FFLD'];
	const foundSchools = await db
		.select()
		.from(schools)
		.where(inArray(schools.code, schoolCodes));

	const fict = foundSchools.find((s) => s.code === 'FICT');
	const fbmg = foundSchools.find((s) => s.code === 'FBMG');
	const fftb = foundSchools.find((s) => s.code === 'FFTB');
	const fcm = foundSchools.find((s) => s.code === 'FCM');
	const fdi = foundSchools.find((s) => s.code === 'FDI');
	const ffld = foundSchools.find((s) => s.code === 'FFLD');

	if (!fict || !fbmg || !fftb || !fcm || !fdi || !ffld) {
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

	addAssociation('Mac Lab', fdi);
	addAssociation('Mac Lab', ffld);
	addAssociation('MM10', fdi);
	addAssociation('MM10', ffld);
	addAssociation('Net Lab', fict);
	addAssociation('Workshop', fict);

	for (let i = 1; i <= 7; i++) {
		addAssociation(`MM${i}`, fict);
	}

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
