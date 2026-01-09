import {
	certificateTypes,
	gradeMappings,
	type StandardGrade,
} from '@/app/admissions/_database';
import { db } from '../index';

export async function seedGradeMappings() {
	console.log('🌱 Seeding grade mappings...');

	const certs = await db.select().from(certificateTypes);
	const certMap = new Map(certs.map((c) => [c.name, c.id]));

	const mappingsToInsert: (typeof gradeMappings.$inferInsert)[] = [];

	const addMapping = (
		certName: string,
		original: string,
		standard: StandardGrade
	) => {
		const id = certMap.get(certName);
		if (id) {
			mappingsToInsert.push({
				certificateTypeId: id,
				originalGrade: original,
				standardGrade: standard,
			});
		}
	};

	const cambridgeStyles = ['LGCSE', 'IGCSE', 'GCE O-Level'];
	for (const cert of cambridgeStyles) {
		addMapping(cert, 'A*', 'A*');
		addMapping(cert, 'A', 'A');
		addMapping(cert, 'B', 'B');
		addMapping(cert, 'C', 'C');
		addMapping(cert, 'D', 'D');
		addMapping(cert, 'E', 'E');
		addMapping(cert, 'F', 'F');
		addMapping(cert, 'G', 'F');
		addMapping(cert, 'U', 'U');
	}

	addMapping('COSC', '1', 'A');
	addMapping('COSC', '2', 'A');
	addMapping('COSC', '3', 'B');
	addMapping('COSC', '4', 'B');
	addMapping('COSC', '5', 'C');
	addMapping('COSC', '6', 'C');
	addMapping('COSC', '7', 'D');
	addMapping('COSC', '8', 'E');
	addMapping('COSC', '9', 'U');

	addMapping('NSC', '7', 'A');
	addMapping('NSC', '6', 'B');
	addMapping('NSC', '5', 'C');
	addMapping('NSC', '4', 'D');
	addMapping('NSC', '3', 'E');
	addMapping('NSC', '2', 'F');
	addMapping('NSC', '1', 'U');

	if (mappingsToInsert.length > 0) {
		await db
			.insert(gradeMappings)
			.values(mappingsToInsert)
			.onConflictDoNothing();
		console.log(`✅ Seeded ${mappingsToInsert.length} grade mappings.`);
	}
}
