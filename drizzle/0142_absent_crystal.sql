-- Custom SQL migration file, put your code below! --
ALTER TABLE "registration_requests"
    ADD CONSTRAINT "chk_registration_requests_semester_number_not_blank"
    CHECK (trim(semester_number) <> '');