DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Mother' AND enumtypid = 'next_of_kin_relationship'::regtype) THEN
    ALTER TYPE "next_of_kin_relationship" ADD VALUE 'Mother';
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Father' AND enumtypid = 'next_of_kin_relationship'::regtype) THEN
    ALTER TYPE "next_of_kin_relationship" ADD VALUE 'Father';
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Husband' AND enumtypid = 'next_of_kin_relationship'::regtype) THEN
    ALTER TYPE "next_of_kin_relationship" ADD VALUE 'Husband';
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Wife' AND enumtypid = 'next_of_kin_relationship'::regtype) THEN
    ALTER TYPE "next_of_kin_relationship" ADD VALUE 'Wife';
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Permanent' AND enumtypid = 'next_of_kin_relationship'::regtype) THEN
    ALTER TYPE "next_of_kin_relationship" ADD VALUE 'Permanent';
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Self' AND enumtypid = 'next_of_kin_relationship'::regtype) THEN
    ALTER TYPE "next_of_kin_relationship" ADD VALUE 'Self';
  END IF;
END $$;