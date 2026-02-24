-- Backfill activity_type for existing audit_logs records.
-- Maps table_name + operation (+ status from new_values where applicable) to activity types.
-- Only affects rows where activity_type IS NULL.

UPDATE audit_logs SET activity_type = CASE
  -- Students
  WHEN table_name = 'students' AND operation = 'INSERT' THEN 'student_creation'
  WHEN table_name = 'students' AND operation = 'UPDATE' THEN 'student_update'
  WHEN table_name = 'students' AND operation = 'DELETE' THEN 'student_deletion'

  -- Student Programs (status-based)
  WHEN table_name = 'student_programs' AND operation = 'INSERT' THEN 'program_enrollment'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Completed' THEN 'program_completed'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Active' THEN 'program_activated'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Changed' THEN 'program_change'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Deleted' THEN 'program_deleted'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Inactive' THEN 'program_deactivated'

  -- Student Semesters (status-based)
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Active' THEN 'semester_activated'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Deferred' THEN 'semester_deferred'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'DroppedOut' THEN 'semester_dropout'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Deleted' THEN 'semester_deleted'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Withdrawn' THEN 'semester_withdrawal'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Repeat' THEN 'semester_repeat'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Inactive' THEN 'semester_deactivated'

  -- Student Modules (status-based)
  WHEN table_name = 'student_modules' AND operation = 'UPDATE' AND new_values->>'status' = 'Drop' THEN 'module_dropped'
  WHEN table_name = 'student_modules' AND operation = 'UPDATE' AND new_values->>'status' = 'Delete' THEN 'module_deleted'
  WHEN table_name = 'student_modules' AND operation = 'UPDATE' AND new_values->>'status' LIKE 'Repeat%' THEN 'module_repeated'
  WHEN table_name = 'student_modules' AND operation = 'UPDATE' THEN 'module_update'

  -- Clearance (status-based)
  WHEN table_name = 'clearance' AND operation = 'INSERT' THEN 'clearance_created'
  WHEN table_name = 'clearance' AND operation = 'UPDATE' AND new_values->>'status' = 'rejected' THEN 'clearance_rejected'
  WHEN table_name = 'clearance' AND operation = 'UPDATE' THEN 'clearance_approved'

  -- Registration Requests
  WHEN table_name = 'registration_requests' AND operation = 'INSERT' THEN 'registration_submitted'
  WHEN table_name = 'registration_requests' AND operation = 'UPDATE' THEN 'registration_updated'
  WHEN table_name = 'registration_requests' AND operation = 'DELETE' THEN 'registration_cancelled'

  -- Prints
  WHEN table_name = 'transcript_prints' AND operation = 'INSERT' THEN 'transcript_print'
  WHEN table_name = 'statement_of_results_prints' AND operation = 'INSERT' THEN 'statement_of_results_print'
  WHEN table_name = 'student_card_prints' AND operation = 'INSERT' THEN 'student_card_print'

  -- Graduation
  WHEN table_name = 'graduation_dates' AND operation = 'INSERT' THEN 'graduation_date_created'
  WHEN table_name = 'graduation_dates' AND operation = 'UPDATE' THEN 'graduation_date_updated'
  WHEN table_name = 'graduation_requests' AND operation = 'INSERT' THEN 'graduation_request_submitted'
  WHEN table_name = 'graduation_requests' AND operation = 'UPDATE' THEN 'graduation_request_updated'
  WHEN table_name = 'graduation_clearance' AND operation = 'INSERT' THEN 'graduation_clearance_created'
  WHEN table_name = 'graduation_clearance' AND operation = 'UPDATE' THEN 'graduation_clearance_decision'

  -- Certificates
  WHEN table_name = 'certificate_reprints' AND operation = 'INSERT' THEN 'certificate_reprint'

  -- Blocked Students
  WHEN table_name = 'blocked_students' AND operation = 'INSERT' THEN 'student_blocked'
  WHEN table_name = 'blocked_students' AND operation = 'DELETE' THEN 'student_unblocked'

  -- Terms
  WHEN table_name = 'terms' AND operation = 'INSERT' THEN 'term_created'
  WHEN table_name = 'terms' AND operation = 'UPDATE' THEN 'term_updated'
  WHEN table_name = 'term_settings' AND operation = 'UPDATE' THEN 'term_settings_updated'

  -- Documents
  WHEN table_name = 'student_documents' AND operation = 'INSERT' THEN 'document_uploaded'

  -- Auto-approvals
  WHEN table_name = 'auto_approvals' AND operation = 'INSERT' THEN 'auto_approval_created'
  WHEN table_name = 'auto_approvals' AND operation = 'UPDATE' THEN 'auto_approval_updated'
  WHEN table_name = 'auto_approvals' AND operation = 'DELETE' THEN 'auto_approval_deleted'

  -- Assessments
  WHEN table_name = 'assessments' AND operation = 'INSERT' THEN 'assessment_created'
  WHEN table_name = 'assessments' AND operation = 'UPDATE' THEN 'assessment_updated'
  WHEN table_name = 'assessments' AND operation = 'DELETE' THEN 'assessment_deleted'

  -- Assessment Marks
  WHEN table_name = 'assessment_marks' AND operation = 'INSERT' THEN 'mark_entered'
  WHEN table_name = 'assessment_marks' AND operation = 'UPDATE' THEN 'mark_updated'
  WHEN table_name = 'assessment_marks' AND operation = 'DELETE' THEN 'mark_deleted'

  -- Assigned Modules
  WHEN table_name = 'assigned_modules' AND operation = 'INSERT' THEN 'module_assigned'
  WHEN table_name = 'assigned_modules' AND operation = 'DELETE' THEN 'module_unassigned'

  -- Attendance
  WHEN table_name = 'attendance' AND operation = 'INSERT' THEN 'attendance_recorded'
  WHEN table_name = 'attendance' AND operation = 'UPDATE' THEN 'attendance_updated'

  -- Modules
  WHEN table_name = 'modules' AND operation = 'INSERT' THEN 'module_created'
  WHEN table_name = 'modules' AND operation = 'UPDATE' THEN 'module_updated'

  -- Semester Modules
  WHEN table_name = 'semester_modules' AND operation = 'INSERT' THEN 'semester_module_created'
  WHEN table_name = 'semester_modules' AND operation = 'UPDATE' THEN 'semester_module_updated'
  WHEN table_name = 'semester_modules' AND operation = 'DELETE' THEN 'semester_module_deleted'

  -- Programs & Structures
  WHEN table_name = 'programs' AND operation = 'INSERT' THEN 'program_created'
  WHEN table_name = 'programs' AND operation = 'UPDATE' THEN 'program_updated'
  WHEN table_name = 'structures' AND operation = 'INSERT' THEN 'structure_created'
  WHEN table_name = 'structures' AND operation = 'UPDATE' THEN 'structure_updated'
  WHEN table_name = 'structure_semesters' AND operation = 'INSERT' THEN 'structure_semester_created'
  WHEN table_name = 'structure_semesters' AND operation = 'UPDATE' THEN 'structure_semester_updated'

  -- Feedback
  WHEN table_name = 'feedback_cycles' AND operation = 'INSERT' THEN 'feedback_cycle_created'
  WHEN table_name = 'feedback_cycles' AND operation = 'UPDATE' THEN 'feedback_cycle_updated'
  WHEN table_name = 'feedback_categories' AND operation = 'INSERT' THEN 'feedback_category_created'
  WHEN table_name = 'feedback_categories' AND operation = 'UPDATE' THEN 'feedback_category_updated'
  WHEN table_name = 'feedback_questions' AND operation = 'INSERT' THEN 'feedback_question_created'
  WHEN table_name = 'feedback_questions' AND operation = 'UPDATE' THEN 'feedback_question_updated'

  -- Finance
  WHEN table_name = 'payment_receipts' AND operation = 'INSERT' THEN 'payment_receipt_added'
  WHEN table_name = 'payment_receipts' AND operation = 'DELETE' THEN 'payment_receipt_removed'
  WHEN table_name = 'sponsors' AND operation = 'INSERT' THEN 'sponsor_created'
  WHEN table_name = 'sponsors' AND operation = 'UPDATE' THEN 'sponsor_updated'
  WHEN table_name = 'sponsored_students' AND operation = 'INSERT' THEN 'sponsorship_assigned'
  WHEN table_name = 'sponsored_students' AND operation = 'UPDATE' THEN 'sponsorship_updated'

  -- Library
  WHEN table_name = 'books' AND operation = 'INSERT' THEN 'book_added'
  WHEN table_name = 'books' AND operation = 'UPDATE' THEN 'book_updated'
  WHEN table_name = 'books' AND operation = 'DELETE' THEN 'book_deleted'
  WHEN table_name = 'book_copies' AND operation = 'INSERT' THEN 'book_copy_added'
  WHEN table_name = 'book_copies' AND operation = 'UPDATE' THEN 'book_copy_updated'
  WHEN table_name = 'loans' AND operation = 'INSERT' THEN 'book_loan_created'
  WHEN table_name = 'loans' AND operation = 'UPDATE' THEN 'book_returned'
  WHEN table_name = 'loans' AND operation = 'DELETE' THEN 'loan_deleted'
  WHEN table_name = 'fines' AND operation = 'INSERT' THEN 'fine_created'
  WHEN table_name = 'fines' AND operation = 'UPDATE' THEN 'fine_updated'
  WHEN table_name = 'authors' AND operation = 'INSERT' THEN 'author_created'
  WHEN table_name = 'authors' AND operation = 'UPDATE' THEN 'author_updated'
  WHEN table_name = 'authors' AND operation = 'DELETE' THEN 'author_deleted'
  WHEN table_name = 'categories' AND operation = 'INSERT' THEN 'category_created'
  WHEN table_name = 'categories' AND operation = 'UPDATE' THEN 'category_updated'
  WHEN table_name = 'categories' AND operation = 'DELETE' THEN 'category_deleted'
  WHEN table_name = 'publications' AND operation = 'INSERT' THEN 'publication_added'
  WHEN table_name = 'publications' AND operation = 'UPDATE' THEN 'publication_updated'
  WHEN table_name = 'publications' AND operation = 'DELETE' THEN 'publication_deleted'
  WHEN table_name = 'question_papers' AND operation = 'INSERT' THEN 'question_paper_uploaded'
  WHEN table_name = 'question_papers' AND operation = 'UPDATE' THEN 'question_paper_updated'
  WHEN table_name = 'question_papers' AND operation = 'DELETE' THEN 'question_paper_deleted'
  WHEN table_name = 'library_settings' AND operation = 'UPDATE' THEN 'library_settings_updated'
  WHEN table_name = 'external_libraries' AND operation = 'INSERT' THEN 'external_library_added'
  WHEN table_name = 'external_libraries' AND operation = 'UPDATE' THEN 'external_library_updated'
  WHEN table_name = 'external_libraries' AND operation = 'DELETE' THEN 'external_library_deleted'

  -- Admissions
  WHEN table_name = 'applications' AND operation = 'INSERT' THEN 'application_submitted'
  WHEN table_name = 'applications' AND operation = 'UPDATE' THEN 'application_updated'
  WHEN table_name = 'applicant_documents' AND operation = 'INSERT' THEN 'applicant_document_uploaded'
  WHEN table_name = 'applicant_documents' AND operation = 'UPDATE' THEN 'applicant_document_reviewed'
  WHEN table_name = 'bank_deposits' AND operation = 'INSERT' THEN 'deposit_submitted'
  WHEN table_name = 'bank_deposits' AND operation = 'UPDATE' THEN 'deposit_verified'
  WHEN table_name = 'applicants' AND operation = 'INSERT' THEN 'applicant_created'
  WHEN table_name = 'applicants' AND operation = 'UPDATE' THEN 'applicant_updated'
  WHEN table_name = 'subjects' AND operation = 'INSERT' THEN 'subject_created'
  WHEN table_name = 'subjects' AND operation = 'UPDATE' THEN 'subject_updated'
  WHEN table_name = 'subjects' AND operation = 'DELETE' THEN 'subject_deleted'
  WHEN table_name = 'recognized_schools' AND operation = 'INSERT' THEN 'recognized_school_added'
  WHEN table_name = 'recognized_schools' AND operation = 'UPDATE' THEN 'recognized_school_updated'
  WHEN table_name = 'recognized_schools' AND operation = 'DELETE' THEN 'recognized_school_deleted'
  WHEN table_name = 'certificate_types' AND operation = 'INSERT' THEN 'certificate_type_created'
  WHEN table_name = 'certificate_types' AND operation = 'UPDATE' THEN 'certificate_type_updated'
  WHEN table_name = 'certificate_types' AND operation = 'DELETE' THEN 'certificate_type_deleted'
  WHEN table_name = 'entry_requirements' AND operation = 'INSERT' THEN 'entry_requirement_created'
  WHEN table_name = 'entry_requirements' AND operation = 'UPDATE' THEN 'entry_requirement_updated'
  WHEN table_name = 'entry_requirements' AND operation = 'DELETE' THEN 'entry_requirement_deleted'
  WHEN table_name = 'intake_periods' AND operation = 'INSERT' THEN 'intake_period_created'
  WHEN table_name = 'intake_periods' AND operation = 'UPDATE' THEN 'intake_period_updated'
  WHEN table_name = 'intake_periods' AND operation = 'DELETE' THEN 'intake_period_deleted'

  -- Admin
  WHEN table_name = 'users' AND operation = 'INSERT' THEN 'user_created'
  WHEN table_name = 'users' AND operation = 'UPDATE' THEN 'user_updated'
  WHEN table_name = 'users' AND operation = 'DELETE' THEN 'user_deleted'
  WHEN table_name = 'tasks' AND operation = 'INSERT' THEN 'task_created'
  WHEN table_name = 'tasks' AND operation = 'UPDATE' THEN 'task_updated'
  WHEN table_name = 'notifications' AND operation = 'INSERT' THEN 'notification_created'
  WHEN table_name = 'notifications' AND operation = 'UPDATE' THEN 'notification_updated'

  -- Timetable
  WHEN table_name = 'venues' AND operation = 'INSERT' THEN 'venue_created'
  WHEN table_name = 'venues' AND operation = 'UPDATE' THEN 'venue_updated'
  WHEN table_name = 'venue_types' AND operation = 'INSERT' THEN 'venue_type_created'
  WHEN table_name = 'venue_types' AND operation = 'UPDATE' THEN 'venue_type_updated'
  WHEN table_name = 'timetable_allocations' AND operation = 'INSERT' THEN 'allocation_created'
  WHEN table_name = 'timetable_allocations' AND operation = 'UPDATE' THEN 'allocation_updated'
  WHEN table_name = 'timetable_allocations' AND operation = 'DELETE' THEN 'allocation_deleted'
  WHEN table_name = 'timetable_slots' AND operation = 'INSERT' THEN 'slot_created'
  WHEN table_name = 'timetable_slots' AND operation = 'UPDATE' THEN 'slot_updated'
  WHEN table_name = 'timetable_slots' AND operation = 'DELETE' THEN 'slot_deleted'

  ELSE NULL
END
WHERE activity_type IS NULL;