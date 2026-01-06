UPDATE "modules"
SET "timestamp" = TO_CHAR(TO_TIMESTAMP("timestamp"::bigint), 'YYYY-MM-DD')
WHERE "timestamp" IS NOT NULL AND "timestamp" SIMILAR TO '[0-9]+';
