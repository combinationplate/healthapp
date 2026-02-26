-- Backfill product_id on existing ce_sends where it is null, using course_name.
-- WooCommerce product IDs per course name.
update public.ce_sends set product_id = 3664 where course_name = 'Ethics in Caring for the Elderly' and product_id is null;
update public.ce_sends set product_id = 20204 where course_name = 'Palliative and Hospice Care' and product_id is null;
update public.ce_sends set product_id = 3715 where course_name = 'Mental Health and The Elderly' and product_id is null;
update public.ce_sends set product_id = 7672 where course_name = 'Chronic Disease Management' and product_id is null;
update public.ce_sends set product_id = 5065 where course_name = 'Patient Safety' and product_id is null;
