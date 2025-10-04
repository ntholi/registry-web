'use server';

import { transcriptPrints } from '@/db/schema';
import { transcriptPrintsService as service } from './service';

type TranscriptPrint = typeof transcriptPrints.$inferInsert;

export async function createTranscriptPrint(data: TranscriptPrint) {
  return service.create(data);
}

export async function getTranscriptPrint(id: string) {
  return service.get(id);
}

export async function findAllTranscriptPrints(page: number = 1, search = '') {
  return service.findAll({ page, search });
}

export async function findTranscriptPrintsByStudent(stdNo: number) {
  return service.findByStudent(stdNo);
}
