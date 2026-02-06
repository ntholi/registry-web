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

	addMapping('COSC', '1', 'A*');
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

	addMapping('GCE AS Level', 'a', 'A');
	addMapping('GCE AS Level', 'A', 'A');
	addMapping('GCE AS Level', 'b', 'B');
	addMapping('GCE AS Level', 'B', 'B');
	addMapping('GCE AS Level', 'c', 'C');
	addMapping('GCE AS Level', 'C', 'C');
	addMapping('GCE AS Level', 'd', 'D');
	addMapping('GCE AS Level', 'D', 'D');
	addMapping('GCE AS Level', 'e', 'E');
	addMapping('GCE AS Level', 'E', 'E');
	addMapping('GCE AS Level', 'U', 'U');

	addMapping('GCE A-Level', 'A*', 'A*');
	addMapping('GCE A-Level', 'a*', 'A*');
	addMapping('GCE A-Level', 'A', 'A');
	addMapping('GCE A-Level', 'a', 'A');
	addMapping('GCE A-Level', 'B', 'B');
	addMapping('GCE A-Level', 'b', 'B');
	addMapping('GCE A-Level', 'C', 'C');
	addMapping('GCE A-Level', 'c', 'C');
	addMapping('GCE A-Level', 'D', 'D');
	addMapping('GCE A-Level', 'd', 'D');
	addMapping('GCE A-Level', 'E', 'E');
	addMapping('GCE A-Level', 'e', 'E');
	addMapping('GCE A-Level', 'U', 'U');

	if (mappingsToInsert.length > 0) {
		await db
			.insert(gradeMappings)
			.values(mappingsToInsert)
			.onConflictDoNothing();
		console.log(`✅ Seeded ${mappingsToInsert.length} grade mappings.`);
	}
}
