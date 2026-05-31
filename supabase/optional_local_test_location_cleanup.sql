-- OPTIONAL LOCAL TEST CLEANUP ONLY
-- Run this only if BOTtWYB3rIJLRnErmqtnzH8IZlPtbiSvsB is your test report token.
-- This changes the already-saved local test rows that were detected as Singapore.
-- It does not affect future production visitors.

update public.trackflow_report_chat_sessions
set
  country_code = '',
  country_name = 'Local test',
  region = '',
  city = ''
where report_token = 'BOTtWYB3rIJLRnErmqtnzH8IZlPtbiSvsB'
  and country_code = 'SG'
  and country_name = 'Singapore';
