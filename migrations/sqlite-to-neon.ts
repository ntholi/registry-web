import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import * as sqliteSchema from '../src/db/old.schema';
import * as postgresSchema from '../src/db/schema';

type SqliteSelect<TTable> = TTable extends { $inferSelect: infer TRow }
  ? TRow
  : never;
type PostgresInsert<TTable> = TTable extends { $inferInsert: infer TRow }
  ? TRow
  : never;

type MigrationPlan<STable, PTable> = {
  readonly name: string;
  readonly sqliteTable: STable;
  readonly postgresTable: PTable;
  readonly map: (row: SqliteSelect<STable>) => PostgresInsert<PTable>;
};

type Mode = 'migrate' | 'verify' | 'migrate-and-verify';

type VerificationResult = {
  readonly table: string;
  readonly sqliteCount: number;
  readonly postgresCount: number;
  readonly hashesMatch: boolean;
  readonly sqliteHash: string;
  readonly postgresHash: string;
  readonly mismatchedRows: ReadonlyArray<RowDiff>;
  readonly samples: SampleSet;
  readonly sampleMismatches: ReadonlyArray<SampleMismatchReport>;
};

type RowDiff = {
  readonly row: Record<string, unknown>;
  readonly sqliteCount: number;
  readonly postgresCount: number;
};

type SampleSet = {
  readonly first: ReadonlyArray<Record<string, unknown>>;
  readonly middle: ReadonlyArray<Record<string, unknown>>;
  readonly last: ReadonlyArray<Record<string, unknown>>;
};

type SampleMismatchReport = {
  readonly category: 'first' | 'middle' | 'last';
  readonly rows: ReadonlyArray<RowDiff>;
};

type SampleValues = {
  readonly first: ReadonlyArray<string>;
  readonly middle: ReadonlyArray<string>;
  readonly last: ReadonlyArray<string>;
};

const BATCH_SIZE = 200;
const SAMPLE_SIZE = 500;
const DIFF_LIMIT = 10;
const SAMPLE_DIFF_LIMIT = 5;

let cachedStudentSemesterIds: Set<number> | null = null;
let cachedStudentModulesExpectedCount: number | null = null;

function assertEnvironment(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in the environment.');
  }
}

function openSqliteDatabase(): ReturnType<
  typeof drizzleSqlite<typeof sqliteSchema>
> {
  const database = new Database('local.db', { readonly: true });
  return drizzleSqlite(database, {
    schema: sqliteSchema,
    casing: 'snake_case',
  });
}

function getStudentSemesterIds(
  sqliteDb: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>
): Set<number> {
  if (cachedStudentSemesterIds) {
    return cachedStudentSemesterIds;
  }
  const rows = sqliteDb
    .select({ id: sqliteSchema.studentSemesters.id })
    .from(sqliteSchema.studentSemesters)
    .all();
  cachedStudentSemesterIds = new Set(
    rows.map(function mapId(row) {
      return row.id;
    })
  );
  return cachedStudentSemesterIds;
}

function getStudentModulesExpectedCount(
  sqliteDb: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>
): number {
  if (cachedStudentModulesExpectedCount !== null) {
    return cachedStudentModulesExpectedCount;
  }
  const row = sqliteDb.$client
    .prepare(
      'select count(*) as count from student_modules where student_semester_id in (select id from student_semesters)'
    )
    .get() as { readonly count?: number } | undefined;
  const count = row && typeof row.count === 'number' ? row.count : 0;
  cachedStudentModulesExpectedCount = count;
  return count;
}

async function openPostgresDatabase(): Promise<
  ReturnType<typeof drizzlePostgres<typeof postgresSchema>>
> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzlePostgres(pool, {
    schema: postgresSchema,
    casing: 'snake_case',
  });
}

function closeSqliteDatabase(
  instance: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>
): void {
  instance.$client.close();
}

async function closePostgresDatabase(
  instance: ReturnType<typeof drizzlePostgres<typeof postgresSchema>>
): Promise<void> {
  await instance.$client.end();
}

function toBoolean(value: unknown): boolean {
  const normalised = toOptionalBoolean(value);
  if (normalised === null) {
    throw new Error('Encountered null while converting to boolean.');
  }
  return normalised;
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === '1' || lower === 'true') {
      return true;
    }
    if (lower === '0' || lower === 'false') {
      return false;
    }
  }
  throw new Error(`Unable to convert value "${String(value)}" to boolean.`);
}

function toOptionalDateFromSeconds(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value;
  }
  if (typeof value === 'number') {
    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    const numeric = Number.parseInt(trimmed, 10);
    if (!Number.isNaN(numeric)) {
      const numericDate = new Date(numeric * 1000);
      if (!Number.isNaN(numericDate.getTime())) {
        return numericDate;
      }
    }
    const asDate = Date.parse(trimmed);
    if (!Number.isNaN(asDate)) {
      const parsedDate = new Date(asDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return null;
      }
      return parsedDate;
    }
  }
  throw new Error(
    `Unable to convert value "${String(value)}" (seconds) to Date.`
  );
}

function toOptionalDateFromMilliseconds(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isNaN(parsed)) {
      const numericDate = new Date(parsed);
      if (Number.isNaN(numericDate.getTime())) {
        return null;
      }
      return numericDate;
    }
    const asDate = Date.parse(trimmed);
    if (!Number.isNaN(asDate)) {
      const parsedDate = new Date(asDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return null;
      }
      return parsedDate;
    }
  }
  throw new Error(
    `Unable to convert value "${String(value)}" (milliseconds) to Date.`
  );
}

function parseJsonArray(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value as string[];
  }
  if (typeof value === 'string') {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed as string[];
    }
  }
  throw new Error(`Unable to convert value "${String(value)}" to JSON array.`);
}

function chunkArray<TItem>(
  items: ReadonlyArray<TItem>,
  size: number
): TItem[][] {
  if (size <= 0) {
    throw new Error('Chunk size must be greater than zero.');
  }
  const result: TItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, Math.min(index + size, items.length)));
  }
  return result;
}

function normaliseValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value.toISOString();
  }
  if (value instanceof Uint8Array) {
    if (value.length === 0) {
      return '';
    }
    return Buffer.from(value).toString('base64');
  }
  if (Array.isArray(value)) {
    return value.map(function mapArrayEntry(entry) {
      return normaliseValue(entry);
    });
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const normalised: Record<string, unknown> = {};
    for (const key of keys) {
      normalised[key] = normaliseValue(record[key]);
    }
    return normalised;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return String(value);
    }
    const multiplier = 1000000;
    return Math.floor(value * multiplier) / multiplier;
  }
  return value;
}

function serialiseRow(row: Record<string, unknown>): string {
  const keys = Object.keys(row).sort();
  const ordered: Record<string, unknown> = {};
  for (const key of keys) {
    ordered[key] = normaliseValue(row[key]);
  }
  return JSON.stringify(ordered);
}

function deserialiseRow(serialised: string): Record<string, unknown> {
  return JSON.parse(serialised) as Record<string, unknown>;
}

function buildFrequencyMap(values: ReadonlyArray<string>): Map<string, number> {
  const map = new Map<string, number>();
  for (const value of values) {
    const current = map.get(value) ?? 0;
    map.set(value, current + 1);
  }
  return map;
}

function calculateHash(values: ReadonlyArray<string>): string {
  if (values.length === 0) {
    return '0';
  }
  const hash = createHash('sha256');
  const sorted = values.slice().sort();
  for (const value of sorted) {
    hash.update(value);
    hash.update('|');
  }
  return hash.digest('hex');
}

function diffFrequencyMaps(
  sqliteMap: Map<string, number>,
  postgresMap: Map<string, number>,
  limit: number
): ReadonlyArray<RowDiff> {
  const differences: RowDiff[] = [];
  const keys = new Set<string>();
  for (const key of sqliteMap.keys()) {
    keys.add(key);
  }
  for (const key of postgresMap.keys()) {
    keys.add(key);
  }
  for (const key of keys) {
    const sqliteCount = sqliteMap.get(key) ?? 0;
    const postgresCount = postgresMap.get(key) ?? 0;
    if (sqliteCount !== postgresCount) {
      differences.push({
        row: deserialiseRow(key),
        sqliteCount,
        postgresCount,
      });
      if (differences.length >= limit) {
        break;
      }
    }
  }
  return differences;
}

function selectSampleValues(
  sortedValues: ReadonlyArray<string>,
  sampleSize: number
): SampleValues {
  if (sortedValues.length === 0) {
    return { first: [], middle: [], last: [] };
  }
  const limit = Math.min(sampleSize, sortedValues.length);
  const first = sortedValues.slice(0, limit);
  const last = sortedValues.slice(sortedValues.length - limit);
  const middleStart = Math.max(
    Math.floor((sortedValues.length - limit) / 2),
    0
  );
  const middle = sortedValues.slice(middleStart, middleStart + limit);
  return { first, middle, last };
}

function materialiseSamples(sampleValues: SampleValues): SampleSet {
  return {
    first: sampleValues.first.map(function toRow(value) {
      return deserialiseRow(value);
    }),
    middle: sampleValues.middle.map(function toRow(value) {
      return deserialiseRow(value);
    }),
    last: sampleValues.last.map(function toRow(value) {
      return deserialiseRow(value);
    }),
  };
}

function collectSampleMismatches(
  sampleValues: SampleValues,
  sqliteMap: Map<string, number>,
  postgresMap: Map<string, number>,
  limit: number
): ReadonlyArray<SampleMismatchReport> {
  const reports: SampleMismatchReport[] = [];
  const categories: Array<{
    readonly name: 'first' | 'middle' | 'last';
    readonly values: ReadonlyArray<string>;
  }> = [
    { name: 'first', values: sampleValues.first },
    { name: 'middle', values: sampleValues.middle },
    { name: 'last', values: sampleValues.last },
  ];
  for (const category of categories) {
    const rows: RowDiff[] = [];
    const uniqueValues = new Set<string>(category.values);
    for (const value of uniqueValues) {
      const sqliteCount = sqliteMap.get(value) ?? 0;
      const postgresCount = postgresMap.get(value) ?? 0;
      if (sqliteCount !== postgresCount) {
        rows.push({
          row: deserialiseRow(value),
          sqliteCount,
          postgresCount,
        });
        if (rows.length >= limit) {
          break;
        }
      }
    }
    if (rows.length > 0) {
      reports.push({ category: category.name, rows });
    }
  }
  return reports;
}

function mapUsers(
  row: SqliteSelect<typeof sqliteSchema.users>
): PostgresInsert<typeof postgresSchema.users> {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    position: row.position,
    email: row.email,
    emailVerified: toOptionalDateFromMilliseconds(row.emailVerified),
    image: row.image,
  };
}

function mapAccounts(
  row: SqliteSelect<typeof sqliteSchema.accounts>
): PostgresInsert<typeof postgresSchema.accounts> {
  return {
    userId: row.userId,
    type: row.type,
    provider: row.provider,
    providerAccountId: row.providerAccountId,
    refresh_token: row.refresh_token,
    access_token: row.access_token,
    expires_at: row.expires_at,
    token_type: row.token_type,
    scope: row.scope,
    id_token: row.id_token,
    session_state: row.session_state,
  };
}

function mapSessions(
  row: SqliteSelect<typeof sqliteSchema.sessions>
): PostgresInsert<typeof postgresSchema.sessions> {
  return {
    sessionToken: row.sessionToken,
    userId: row.userId,
    expires: toOptionalDateFromMilliseconds(row.expires),
  };
}

function mapVerificationTokens(
  row: SqliteSelect<typeof sqliteSchema.verificationTokens>
): PostgresInsert<typeof postgresSchema.verificationTokens> {
  return {
    identifier: row.identifier,
    token: row.token,
    expires: toOptionalDateFromMilliseconds(row.expires),
  };
}

function mapAuthenticators(
  row: SqliteSelect<typeof sqliteSchema.authenticators>
): PostgresInsert<typeof postgresSchema.authenticators> {
  return {
    credentialID: row.credentialID,
    userId: row.userId,
    providerAccountId: row.providerAccountId,
    credentialPublicKey: row.credentialPublicKey,
    counter: row.counter,
    credentialDeviceType: row.credentialDeviceType,
    credentialBackedUp: toBoolean(row.credentialBackedUp),
    transports: row.transports,
  };
}

function mapSignups(
  row: SqliteSelect<typeof sqliteSchema.signups>
): PostgresInsert<typeof postgresSchema.signups> {
  return {
    userId: row.userId,
    name: row.name,
    stdNo: row.stdNo,
    status: row.status,
    message: row.message,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
    updatedAt: toOptionalDateFromSeconds(row.updatedAt),
  };
}

function mapStudents(
  row: SqliteSelect<typeof sqliteSchema.students>
): PostgresInsert<typeof postgresSchema.students> {
  return {
    stdNo: row.stdNo,
    name: row.name,
    nationalId: row.nationalId,
    sem: row.sem,
    dateOfBirth: toOptionalDateFromMilliseconds(row.dateOfBirth),
    phone1: row.phone1,
    phone2: row.phone2,
    gender: row.gender,
    maritalStatus: row.maritalStatus,
    religion: row.religion,
    userId: row.userId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapStudentPrograms(
  row: SqliteSelect<typeof sqliteSchema.studentPrograms>
): PostgresInsert<typeof postgresSchema.studentPrograms> {
  return {
    id: row.id,
    stdNo: row.stdNo,
    intakeDate: row.intakeDate,
    regDate: row.regDate,
    startTerm: row.startTerm,
    structureId: row.structureId,
    stream: row.stream,
    graduationDate: row.graduationDate,
    status: row.status,
    assistProvider: row.assistProvider,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapStudentSemesters(
  row: SqliteSelect<typeof sqliteSchema.studentSemesters>
): PostgresInsert<typeof postgresSchema.studentSemesters> {
  return {
    id: row.id,
    term: row.term,
    semesterNumber: row.semesterNumber,
    status: row.status,
    studentProgramId: row.studentProgramId,
    cafDate: row.cafDate,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapStudentModules(
  row: SqliteSelect<typeof sqliteSchema.studentModules>
): PostgresInsert<typeof postgresSchema.studentModules> {
  return {
    id: row.id,
    semesterModuleId: row.semesterModuleId,
    status: row.status,
    marks: row.marks,
    grade: row.grade,
    studentSemesterId: row.studentSemesterId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapSchools(
  row: SqliteSelect<typeof sqliteSchema.schools>
): PostgresInsert<typeof postgresSchema.schools> {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    isActive: toBoolean(row.isActive),
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapPrograms(
  row: SqliteSelect<typeof sqliteSchema.programs>
): PostgresInsert<typeof postgresSchema.programs> {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    level: row.level,
    schoolId: row.schoolId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapStructures(
  row: SqliteSelect<typeof sqliteSchema.structures>
): PostgresInsert<typeof postgresSchema.structures> {
  return {
    id: row.id,
    code: row.code,
    desc: row.desc,
    programId: row.programId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapStructureSemesters(
  row: SqliteSelect<typeof sqliteSchema.structureSemesters>
): PostgresInsert<typeof postgresSchema.structureSemesters> {
  return {
    id: row.id,
    structureId: row.structureId,
    semesterNumber: row.semesterNumber,
    name: row.name,
    totalCredits: row.totalCredits,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapModules(
  row: SqliteSelect<typeof sqliteSchema.modules>
): PostgresInsert<typeof postgresSchema.modules> {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
    timestamp: row.timestamp,
  };
}

function mapSemesterModules(
  row: SqliteSelect<typeof sqliteSchema.semesterModules>
): PostgresInsert<typeof postgresSchema.semesterModules> {
  return {
    id: row.id,
    moduleId: row.moduleId,
    type: row.type,
    credits: row.credits,
    semesterId: row.semesterId,
    hidden: toBoolean(row.hidden),
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapModulePrerequisites(
  row: SqliteSelect<typeof sqliteSchema.modulePrerequisites>
): PostgresInsert<typeof postgresSchema.modulePrerequisites> {
  return {
    id: row.id,
    semesterModuleId: row.semesterModuleId,
    prerequisiteId: row.prerequisiteId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapTerms(
  row: SqliteSelect<typeof sqliteSchema.terms>
): PostgresInsert<typeof postgresSchema.terms> {
  return {
    id: row.id,
    name: row.name,
    isActive: toBoolean(row.isActive),
    semester: row.semester,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapRegistrationRequests(
  row: SqliteSelect<typeof sqliteSchema.registrationRequests>
): PostgresInsert<typeof postgresSchema.registrationRequests> {
  return {
    id: row.id,
    sponsorId: row.sponsorId,
    stdNo: row.stdNo,
    termId: row.termId,
    status: row.status,
    mailSent: toBoolean(row.mailSent),
    count: row.count,
    semesterStatus: row.semesterStatus,
    semesterNumber: row.semesterNumber,
    message: row.message,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
    updatedAt: toOptionalDateFromSeconds(row.updatedAt),
    dateApproved: toOptionalDateFromSeconds(row.dateApproved),
  };
}

function mapRequestedModules(
  row: SqliteSelect<typeof sqliteSchema.requestedModules>
): PostgresInsert<typeof postgresSchema.requestedModules> {
  return {
    id: row.id,
    moduleStatus: row.moduleStatus,
    registrationRequestId: row.registrationRequestId,
    semesterModuleId: row.semesterModuleId,
    status: row.status,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapClearance(
  row: SqliteSelect<typeof sqliteSchema.clearance>
): PostgresInsert<typeof postgresSchema.clearance> {
  return {
    id: row.id,
    department: row.department,
    status: row.status,
    message: row.message,
    emailSent: toBoolean(row.emailSent),
    respondedBy: row.respondedBy,
    responseDate: toOptionalDateFromSeconds(row.responseDate),
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapRegistrationClearance(
  row: SqliteSelect<typeof sqliteSchema.registrationClearance>
): PostgresInsert<typeof postgresSchema.registrationClearance> {
  return {
    id: row.id,
    registrationRequestId: row.registrationRequestId,
    clearanceId: row.clearanceId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapGraduationRequests(
  row: SqliteSelect<typeof sqliteSchema.graduationRequests>
): PostgresInsert<typeof postgresSchema.graduationRequests> {
  return {
    id: row.id,
    studentProgramId: row.studentProgramId,
    informationConfirmed: toBoolean(row.informationConfirmed),
    message: row.message,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
    updatedAt: toOptionalDateFromSeconds(row.updatedAt),
  };
}

function mapGraduationClearance(
  row: SqliteSelect<typeof sqliteSchema.graduationClearance>
): PostgresInsert<typeof postgresSchema.graduationClearance> {
  return {
    id: row.id,
    graduationRequestId: row.graduationRequestId,
    clearanceId: row.clearanceId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapGraduationLists(
  row: SqliteSelect<typeof sqliteSchema.graduationLists>
): PostgresInsert<typeof postgresSchema.graduationLists> {
  return {
    id: row.id,
    name: row.name,
    spreadsheetId: row.spreadsheetId,
    spreadsheetUrl: row.spreadsheetUrl,
    status: row.status,
    createdBy: row.createdBy,
    populatedAt: toOptionalDateFromSeconds(row.populatedAt),
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapPaymentReceipts(
  row: SqliteSelect<typeof sqliteSchema.paymentReceipts>
): PostgresInsert<typeof postgresSchema.paymentReceipts> {
  return {
    id: row.id,
    graduationRequestId: row.graduationRequestId,
    paymentType: row.paymentType,
    receiptNo: row.receiptNo,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapClearanceAudit(
  row: SqliteSelect<typeof sqliteSchema.clearanceAudit>
): PostgresInsert<typeof postgresSchema.clearanceAudit> {
  return {
    id: row.id,
    clearanceId: row.clearanceId,
    previousStatus: row.previousStatus,
    newStatus: row.newStatus,
    createdBy: row.createdBy,
    date: toOptionalDateFromSeconds(row.date),
    message: row.message,
    modules: parseJsonArray(row.modules),
  };
}

function mapSponsors(
  row: SqliteSelect<typeof sqliteSchema.sponsors>
): PostgresInsert<typeof postgresSchema.sponsors> {
  return {
    id: row.id,
    name: row.name,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
    updatedAt: toOptionalDateFromSeconds(row.updatedAt),
  };
}

function mapSponsoredStudents(
  row: SqliteSelect<typeof sqliteSchema.sponsoredStudents>
): PostgresInsert<typeof postgresSchema.sponsoredStudents> {
  return {
    id: row.id,
    sponsorId: row.sponsorId,
    stdNo: row.stdNo,
    borrowerNo: row.borrowerNo,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    confirmed: toOptionalBoolean(row.confirmed),
    createdAt: toOptionalDateFromSeconds(row.createdAt),
    updatedAt: toOptionalDateFromSeconds(row.updatedAt),
  };
}

function mapSponsoredTerms(
  row: SqliteSelect<typeof sqliteSchema.sponsoredTerms>
): PostgresInsert<typeof postgresSchema.sponsoredTerms> {
  return {
    id: row.id,
    sponsoredStudentId: row.sponsoredStudentId,
    termId: row.termId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
    updatedAt: toOptionalDateFromSeconds(row.updatedAt),
  };
}

function mapAssignedModules(
  row: SqliteSelect<typeof sqliteSchema.assignedModules>
): PostgresInsert<typeof postgresSchema.assignedModules> {
  return {
    id: row.id,
    termId: row.termId,
    active: toBoolean(row.active),
    userId: row.userId,
    semesterModuleId: row.semesterModuleId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapUserSchools(
  row: SqliteSelect<typeof sqliteSchema.userSchools>
): PostgresInsert<typeof postgresSchema.userSchools> {
  return {
    id: row.id,
    userId: row.userId,
    schoolId: row.schoolId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapAssessments(
  row: SqliteSelect<typeof sqliteSchema.assessments>
): PostgresInsert<typeof postgresSchema.assessments> {
  return {
    id: row.id,
    moduleId: row.moduleId,
    termId: row.termId,
    assessmentNumber: row.assessmentNumber,
    assessmentType: row.assessmentType,
    totalMarks: row.totalMarks,
    weight: row.weight,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapAssessmentMarks(
  row: SqliteSelect<typeof sqliteSchema.assessmentMarks>
): PostgresInsert<typeof postgresSchema.assessmentMarks> {
  return {
    id: row.id,
    assessmentId: row.assessmentId,
    stdNo: row.stdNo,
    marks: row.marks,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapAssessmentMarksAudit(
  row: SqliteSelect<typeof sqliteSchema.assessmentMarksAudit>
): PostgresInsert<typeof postgresSchema.assessmentMarksAudit> {
  return {
    id: row.id,
    assessmentMarkId: row.assessmentMarkId,
    action: row.action,
    previousMarks: row.previousMarks,
    newMarks: row.newMarks,
    createdBy: row.createdBy,
    date: toOptionalDateFromSeconds(row.date),
  };
}

function mapAssessmentsAudit(
  row: SqliteSelect<typeof sqliteSchema.assessmentsAudit>
): PostgresInsert<typeof postgresSchema.assessmentsAudit> {
  return {
    id: row.id,
    assessmentId: row.assessmentId,
    action: row.action,
    previousAssessmentNumber: row.previousAssessmentNumber,
    newAssessmentNumber: row.newAssessmentNumber,
    previousAssessmentType: row.previousAssessmentType,
    newAssessmentType: row.newAssessmentType,
    previousTotalMarks: row.previousTotalMarks,
    newTotalMarks: row.newTotalMarks,
    previousWeight: row.previousWeight,
    newWeight: row.newWeight,
    createdBy: row.createdBy,
    date: toOptionalDateFromSeconds(row.date),
  };
}

function mapModuleGrades(
  row: SqliteSelect<typeof sqliteSchema.moduleGrades>
): PostgresInsert<typeof postgresSchema.moduleGrades> {
  return {
    id: row.id,
    moduleId: row.moduleId,
    stdNo: row.stdNo,
    grade: row.grade,
    weightedTotal: row.weightedTotal,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
    updatedAt: toOptionalDateFromSeconds(row.updatedAt),
  };
}

function mapStatementOfResultsPrints(
  row: SqliteSelect<typeof sqliteSchema.statementOfResultsPrints>
): PostgresInsert<typeof postgresSchema.statementOfResultsPrints> {
  return {
    id: row.id,
    stdNo: row.stdNo,
    printedBy: row.printedBy,
    studentName: row.studentName,
    programName: row.programName,
    totalCredits: row.totalCredits,
    totalModules: row.totalModules,
    cgpa: row.cgpa,
    classification: row.classification,
    academicStatus: row.academicStatus,
    graduationDate: row.graduationDate,
    printedAt: toOptionalDateFromSeconds(row.printedAt),
  };
}

function mapTranscriptPrints(
  row: SqliteSelect<typeof sqliteSchema.transcriptPrints>
): PostgresInsert<typeof postgresSchema.transcriptPrints> {
  return {
    id: row.id,
    stdNo: row.stdNo,
    printedBy: row.printedBy,
    studentName: row.studentName,
    programName: row.programName,
    totalCredits: row.totalCredits,
    cgpa: row.cgpa,
    printedAt: toOptionalDateFromSeconds(row.printedAt),
  };
}

function mapBlockedStudents(
  row: SqliteSelect<typeof sqliteSchema.blockedStudents>
): PostgresInsert<typeof postgresSchema.blockedStudents> {
  return {
    id: row.id,
    status: row.status,
    reason: row.reason,
    byDepartment: row.byDepartment,
    stdNo: row.stdNo,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapStudentCardPrints(
  row: SqliteSelect<typeof sqliteSchema.studentCardPrints>
): PostgresInsert<typeof postgresSchema.studentCardPrints> {
  return {
    id: row.id,
    receiptNo: row.receiptNo,
    stdNo: row.stdNo,
    printedBy: row.printedBy,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapDocuments(
  row: SqliteSelect<typeof sqliteSchema.documents>
): PostgresInsert<typeof postgresSchema.documents> {
  return {
    id: row.id,
    fileName: row.fileName,
    type: row.type,
    stdNo: row.stdNo,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function mapFortinetRegistrations(
  row: SqliteSelect<typeof sqliteSchema.fortinetRegistrations>
): PostgresInsert<typeof postgresSchema.fortinetRegistrations> {
  return {
    id: row.id,
    stdNo: row.stdNo,
    schoolId: row.schoolId,
    level: row.level,
    status: row.status,
    message: row.message,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
    updatedAt: toOptionalDateFromSeconds(row.updatedAt),
  };
}

function mapTasks(
  row: SqliteSelect<typeof sqliteSchema.tasks>
): PostgresInsert<typeof postgresSchema.tasks> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    department: row.department,
    createdBy: row.createdBy,
    scheduledFor: toOptionalDateFromSeconds(row.scheduledFor),
    dueDate: toOptionalDateFromSeconds(row.dueDate),
    completedAt: toOptionalDateFromSeconds(row.completedAt),
    createdAt: toOptionalDateFromSeconds(row.createdAt),
    updatedAt: toOptionalDateFromSeconds(row.updatedAt),
  };
}

function mapTaskAssignments(
  row: SqliteSelect<typeof sqliteSchema.taskAssignments>
): PostgresInsert<typeof postgresSchema.taskAssignments> {
  return {
    id: row.id,
    taskId: row.taskId,
    userId: row.userId,
    createdAt: toOptionalDateFromSeconds(row.createdAt),
  };
}

function definePlan<STable, PTable>(
  plan: MigrationPlan<STable, PTable>
): MigrationPlan<STable, PTable> {
  return plan;
}

const plans = [
  definePlan({
    name: 'users',
    sqliteTable: sqliteSchema.users,
    postgresTable: postgresSchema.users,
    map: mapUsers,
  }),
  definePlan({
    name: 'accounts',
    sqliteTable: sqliteSchema.accounts,
    postgresTable: postgresSchema.accounts,
    map: mapAccounts,
  }),
  definePlan({
    name: 'sessions',
    sqliteTable: sqliteSchema.sessions,
    postgresTable: postgresSchema.sessions,
    map: mapSessions,
  }),
  definePlan({
    name: 'verification_tokens',
    sqliteTable: sqliteSchema.verificationTokens,
    postgresTable: postgresSchema.verificationTokens,
    map: mapVerificationTokens,
  }),
  definePlan({
    name: 'authenticators',
    sqliteTable: sqliteSchema.authenticators,
    postgresTable: postgresSchema.authenticators,
    map: mapAuthenticators,
  }),
  definePlan({
    name: 'signups',
    sqliteTable: sqliteSchema.signups,
    postgresTable: postgresSchema.signups,
    map: mapSignups,
  }),
  definePlan({
    name: 'schools',
    sqliteTable: sqliteSchema.schools,
    postgresTable: postgresSchema.schools,
    map: mapSchools,
  }),
  definePlan({
    name: 'programs',
    sqliteTable: sqliteSchema.programs,
    postgresTable: postgresSchema.programs,
    map: mapPrograms,
  }),
  definePlan({
    name: 'structures',
    sqliteTable: sqliteSchema.structures,
    postgresTable: postgresSchema.structures,
    map: mapStructures,
  }),
  definePlan({
    name: 'structure_semesters',
    sqliteTable: sqliteSchema.structureSemesters,
    postgresTable: postgresSchema.structureSemesters,
    map: mapStructureSemesters,
  }),
  definePlan({
    name: 'modules',
    sqliteTable: sqliteSchema.modules,
    postgresTable: postgresSchema.modules,
    map: mapModules,
  }),
  definePlan({
    name: 'terms',
    sqliteTable: sqliteSchema.terms,
    postgresTable: postgresSchema.terms,
    map: mapTerms,
  }),
  definePlan({
    name: 'semester_modules',
    sqliteTable: sqliteSchema.semesterModules,
    postgresTable: postgresSchema.semesterModules,
    map: mapSemesterModules,
  }),
  definePlan({
    name: 'module_prerequisites',
    sqliteTable: sqliteSchema.modulePrerequisites,
    postgresTable: postgresSchema.modulePrerequisites,
    map: mapModulePrerequisites,
  }),
  definePlan({
    name: 'sponsors',
    sqliteTable: sqliteSchema.sponsors,
    postgresTable: postgresSchema.sponsors,
    map: mapSponsors,
  }),
  definePlan({
    name: 'students',
    sqliteTable: sqliteSchema.students,
    postgresTable: postgresSchema.students,
    map: mapStudents,
  }),
  definePlan({
    name: 'student_programs',
    sqliteTable: sqliteSchema.studentPrograms,
    postgresTable: postgresSchema.studentPrograms,
    map: mapStudentPrograms,
  }),
  definePlan({
    name: 'student_semesters',
    sqliteTable: sqliteSchema.studentSemesters,
    postgresTable: postgresSchema.studentSemesters,
    map: mapStudentSemesters,
  }),
  definePlan({
    name: 'student_modules',
    sqliteTable: sqliteSchema.studentModules,
    postgresTable: postgresSchema.studentModules,
    map: mapStudentModules,
  }),
  definePlan({
    name: 'sponsored_students',
    sqliteTable: sqliteSchema.sponsoredStudents,
    postgresTable: postgresSchema.sponsoredStudents,
    map: mapSponsoredStudents,
  }),
  definePlan({
    name: 'sponsored_terms',
    sqliteTable: sqliteSchema.sponsoredTerms,
    postgresTable: postgresSchema.sponsoredTerms,
    map: mapSponsoredTerms,
  }),
  definePlan({
    name: 'registration_requests',
    sqliteTable: sqliteSchema.registrationRequests,
    postgresTable: postgresSchema.registrationRequests,
    map: mapRegistrationRequests,
  }),
  definePlan({
    name: 'requested_modules',
    sqliteTable: sqliteSchema.requestedModules,
    postgresTable: postgresSchema.requestedModules,
    map: mapRequestedModules,
  }),
  definePlan({
    name: 'clearance',
    sqliteTable: sqliteSchema.clearance,
    postgresTable: postgresSchema.clearance,
    map: mapClearance,
  }),
  definePlan({
    name: 'registration_clearance',
    sqliteTable: sqliteSchema.registrationClearance,
    postgresTable: postgresSchema.registrationClearance,
    map: mapRegistrationClearance,
  }),
  definePlan({
    name: 'graduation_lists',
    sqliteTable: sqliteSchema.graduationLists,
    postgresTable: postgresSchema.graduationLists,
    map: mapGraduationLists,
  }),
  definePlan({
    name: 'graduation_requests',
    sqliteTable: sqliteSchema.graduationRequests,
    postgresTable: postgresSchema.graduationRequests,
    map: mapGraduationRequests,
  }),
  definePlan({
    name: 'graduation_clearance',
    sqliteTable: sqliteSchema.graduationClearance,
    postgresTable: postgresSchema.graduationClearance,
    map: mapGraduationClearance,
  }),
  definePlan({
    name: 'payment_receipts',
    sqliteTable: sqliteSchema.paymentReceipts,
    postgresTable: postgresSchema.paymentReceipts,
    map: mapPaymentReceipts,
  }),
  definePlan({
    name: 'clearance_audit',
    sqliteTable: sqliteSchema.clearanceAudit,
    postgresTable: postgresSchema.clearanceAudit,
    map: mapClearanceAudit,
  }),
  definePlan({
    name: 'assigned_modules',
    sqliteTable: sqliteSchema.assignedModules,
    postgresTable: postgresSchema.assignedModules,
    map: mapAssignedModules,
  }),
  definePlan({
    name: 'user_schools',
    sqliteTable: sqliteSchema.userSchools,
    postgresTable: postgresSchema.userSchools,
    map: mapUserSchools,
  }),
  definePlan({
    name: 'assessments',
    sqliteTable: sqliteSchema.assessments,
    postgresTable: postgresSchema.assessments,
    map: mapAssessments,
  }),
  definePlan({
    name: 'assessment_marks',
    sqliteTable: sqliteSchema.assessmentMarks,
    postgresTable: postgresSchema.assessmentMarks,
    map: mapAssessmentMarks,
  }),
  definePlan({
    name: 'assessment_marks_audit',
    sqliteTable: sqliteSchema.assessmentMarksAudit,
    postgresTable: postgresSchema.assessmentMarksAudit,
    map: mapAssessmentMarksAudit,
  }),
  definePlan({
    name: 'assessments_audit',
    sqliteTable: sqliteSchema.assessmentsAudit,
    postgresTable: postgresSchema.assessmentsAudit,
    map: mapAssessmentsAudit,
  }),
  definePlan({
    name: 'module_grades',
    sqliteTable: sqliteSchema.moduleGrades,
    postgresTable: postgresSchema.moduleGrades,
    map: mapModuleGrades,
  }),
  definePlan({
    name: 'statement_of_results_prints',
    sqliteTable: sqliteSchema.statementOfResultsPrints,
    postgresTable: postgresSchema.statementOfResultsPrints,
    map: mapStatementOfResultsPrints,
  }),
  definePlan({
    name: 'transcript_prints',
    sqliteTable: sqliteSchema.transcriptPrints,
    postgresTable: postgresSchema.transcriptPrints,
    map: mapTranscriptPrints,
  }),
  definePlan({
    name: 'blocked_students',
    sqliteTable: sqliteSchema.blockedStudents,
    postgresTable: postgresSchema.blockedStudents,
    map: mapBlockedStudents,
  }),
  definePlan({
    name: 'student_card_prints',
    sqliteTable: sqliteSchema.studentCardPrints,
    postgresTable: postgresSchema.studentCardPrints,
    map: mapStudentCardPrints,
  }),
  definePlan({
    name: 'documents',
    sqliteTable: sqliteSchema.documents,
    postgresTable: postgresSchema.documents,
    map: mapDocuments,
  }),
  definePlan({
    name: 'fortinet_registrations',
    sqliteTable: sqliteSchema.fortinetRegistrations,
    postgresTable: postgresSchema.fortinetRegistrations,
    map: mapFortinetRegistrations,
  }),
  definePlan({
    name: 'tasks',
    sqliteTable: sqliteSchema.tasks,
    postgresTable: postgresSchema.tasks,
    map: mapTasks,
  }),
  definePlan({
    name: 'task_assignments',
    sqliteTable: sqliteSchema.taskAssignments,
    postgresTable: postgresSchema.taskAssignments,
    map: mapTaskAssignments,
  }),
] as const;

async function migrateTables(
  sqliteDb: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>,
  postgresDb: ReturnType<typeof drizzlePostgres<typeof postgresSchema>>
): Promise<void> {
  for (const plan of plans) {
    const rows = sqliteDb.select().from(plan.sqliteTable).all();
    if (rows.length === 0) {
      console.log(`[SKIP] ${plan.name}: no rows found in source.`);
      continue;
    }
    let filteredRows = rows;
    let skipped = 0;
    if (plan.name === 'student_modules') {
      const validStudentSemesterIds = getStudentSemesterIds(sqliteDb);
      filteredRows = rows.filter(function filterStudentModules(row) {
        if (
          row.studentSemesterId === null ||
          row.studentSemesterId === undefined
        ) {
          return false;
        }
        return validStudentSemesterIds.has(row.studentSemesterId);
      });
      skipped = rows.length - filteredRows.length;
      if (skipped > 0) {
        console.warn(
          `[WARN] ${plan.name}: skipped ${skipped} rows missing related student_semesters.`
        );
      }
    }
    const transformed = filteredRows.map(plan.map);
    const chunks = chunkArray(transformed, BATCH_SIZE);
    for (const chunk of chunks) {
      await postgresDb
        .insert(plan.postgresTable)
        .values(chunk)
        .onConflictDoNothing();
    }
    const logSuffix = skipped > 0 ? ` (skipped ${skipped})` : '';
    console.log(
      `[OK] ${plan.name}: migrated ${transformed.length} rows.${logSuffix}`
    );
  }
}

async function verifyTables(
  sqliteDb: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>,
  postgresDb: ReturnType<typeof drizzlePostgres<typeof postgresSchema>>
): Promise<ReadonlyArray<VerificationResult>> {
  const results: VerificationResult[] = [];
  for (const plan of plans) {
    const sqliteRawRows = sqliteDb.select().from(plan.sqliteTable).all();
    let filteredSqliteRows = sqliteRawRows;
    let skipped = 0;
    if (plan.name === 'student_modules') {
      const validStudentSemesterIds = getStudentSemesterIds(sqliteDb);
      filteredSqliteRows = sqliteRawRows.filter(
        function filterStudentModules(row) {
          if (
            row.studentSemesterId === null ||
            row.studentSemesterId === undefined
          ) {
            return false;
          }
          return validStudentSemesterIds.has(row.studentSemesterId);
        }
      );
      skipped = sqliteRawRows.length - filteredSqliteRows.length;
    }
    const postgresRows = await postgresDb.select().from(plan.postgresTable);
    const sqliteSerialised = filteredSqliteRows.map(
      function serialiseSqlite(row) {
        return serialiseRow(row as unknown as Record<string, unknown>);
      }
    );
    const postgresSerialised = postgresRows.map(
      function serialisePostgres(row) {
        return serialiseRow(row as unknown as Record<string, unknown>);
      }
    );
    const sqliteHash = calculateHash(sqliteSerialised);
    const postgresHash = calculateHash(postgresSerialised);
    const sqliteMap = buildFrequencyMap(sqliteSerialised);
    const postgresMap = buildFrequencyMap(postgresSerialised);
    const mismatchedRows = diffFrequencyMaps(
      sqliteMap,
      postgresMap,
      DIFF_LIMIT
    );
    const sortedSqliteValues = sqliteSerialised.slice().sort();
    const sampleValues = selectSampleValues(sortedSqliteValues, SAMPLE_SIZE);
    const sampleMismatches = collectSampleMismatches(
      sampleValues,
      sqliteMap,
      postgresMap,
      SAMPLE_DIFF_LIMIT
    );
    const hashesMatch =
      mismatchedRows.length === 0 &&
      sampleMismatches.length === 0 &&
      sqliteHash === postgresHash &&
      filteredSqliteRows.length === postgresRows.length;
    const status = hashesMatch ? 'MATCH' : 'MISMATCH';
    console.log(
      `[${status}] ${plan.name}: sqlite=${filteredSqliteRows.length} postgres=${postgresRows.length} hashMatch=${hashesMatch}`
    );
    console.log(`  sqliteHash=${sqliteHash}`);
    console.log(`  postgresHash=${postgresHash}`);
    console.log(
      `  sample first=${sampleValues.first.length} middle=${sampleValues.middle.length} last=${sampleValues.last.length}`
    );
    if (plan.name === 'student_modules' && skipped > 0) {
      console.log(
        `  excluded ${skipped} sqlite rows without matching student_semesters during verification`
      );
    }
    if (mismatchedRows.length > 0) {
      for (const diff of mismatchedRows) {
        console.warn(
          `  mismatch row=${JSON.stringify(diff.row)} sqliteCount=${diff.sqliteCount} postgresCount=${diff.postgresCount}`
        );
      }
    } else {
      console.log('  frequency check passed');
    }
    if (sampleMismatches.length > 0) {
      for (const report of sampleMismatches) {
        for (const rowDiff of report.rows) {
          console.warn(
            `  sample ${report.category} mismatch row=${JSON.stringify(rowDiff.row)} sqliteCount=${rowDiff.sqliteCount} postgresCount=${rowDiff.postgresCount}`
          );
        }
      }
    } else {
      console.log('  sample verification passed');
    }
    results.push({
      table: plan.name,
      sqliteCount: filteredSqliteRows.length,
      postgresCount: postgresRows.length,
      hashesMatch,
      sqliteHash,
      postgresHash,
      mismatchedRows,
      samples: materialiseSamples(sampleValues),
      sampleMismatches,
    });
  }
  return results;
}

function parseMode(): Mode {
  const argument = process.argv[2];
  if (!argument) {
    return 'migrate-and-verify';
  }
  if (argument === 'migrate') {
    return 'migrate';
  }
  if (argument === 'verify') {
    return 'verify';
  }
  if (argument === 'migrate-and-verify') {
    return 'migrate-and-verify';
  }
  throw new Error(
    `Unknown mode "${argument}". Use migrate, verify, or migrate-and-verify.`
  );
}

async function run(): Promise<void> {
  assertEnvironment();
  const mode = parseMode();
  const sqliteDb = openSqliteDatabase();
  const postgresDb = await openPostgresDatabase();
  try {
    if (mode === 'migrate' || mode === 'migrate-and-verify') {
      console.log('Starting data migration from SQLite to Neon/PostgreSQL.');
      await migrateTables(sqliteDb, postgresDb);
      console.log('Data migration completed.');
    }
    if (mode === 'verify' || mode === 'migrate-and-verify') {
      console.log('Starting dataset verification.');
      await verifyTables(sqliteDb, postgresDb);
      console.log('Verification completed.');
    }
  } finally {
    await closePostgresDatabase(postgresDb);
    closeSqliteDatabase(sqliteDb);
  }
}

run().catch(function handleError(error) {
  console.error('Migration script failed.');
  console.error(error);
  process.exit(1);
});
