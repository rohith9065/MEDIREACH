# MediReach — Full Data Model (Reference)

This documents the **complete** target schema for MediReach across all phases. Only the
tables marked `[Phase 1 ✅]` actually exist as migrations today — everything else is a
reference map so each future phase's migration slots into a known structure instead of
being designed from scratch mid-build.

Geo columns use plain `DOUBLE PRECISION latitude/longitude` rather than PostGIS
`geography`/`geometry` types, since PostGIS isn't installed on the local Postgres used for
development (see root README). Nearby-search queries (Phase 4) will use a Haversine-formula
SQL expression instead of `ST_DWithin`. If PostGIS is installed later, the geo columns can
be swapped for a `geography(Point)` column with a generated-column or trigger keeping it in
sync, without changing the API surface.

## users `[Phase 1 ✅]`
`id, name, email, phone, password_hash, role, latitude, longitude, created_at, updated_at`
Role enum: `PATIENT | HOSPITAL_ADMIN | DOCTOR | AMBULANCE_DRIVER | SUPER_ADMIN`

## hospitals `[Phase 2]`
`id, name, registration_number, description, phone, emergency_phone, email, address, latitude, longitude, rating, verified, status, created_at, updated_at`

## hospital_staff `[Phase 2]`
`id, hospital_id -> hospitals, user_id -> users, role, created_at`

## departments `[Phase 2]`
`id, hospital_id -> hospitals, name, description, status`

## doctors `[Phase 2]`
`id, user_id -> users, hospital_id -> hospitals, department_id -> departments, name, specialization, experience, consultation_fee, status, profile_image`

## doctor_schedules `[Phase 6]`
`id, doctor_id -> doctors, day_of_week, start_time, end_time`

## doctor_availability `[Phase 6]`
`id, doctor_id -> doctors, date, start_time, end_time, status`

## beds `[Phase 2]`
`id, hospital_id -> hospitals, bed_type, total_beds, occupied_beds, available_beds, last_updated, updated_by -> users`
Bed types: `ICU | GENERAL | EMERGENCY | PEDIATRIC | MATERNITY | ISOLATION`
Invariant enforced in application/service layer: `0 <= occupied_beds <= total_beds` and `available_beds = total_beds - occupied_beds` (never negative).

## facilities `[Phase 2]`
`id, hospital_id -> hospitals, facility_name, status, quantity, last_updated, updated_by -> users`

## appointments `[Phase 6]`
`id, patient_id -> users, doctor_id -> doctors, hospital_id -> hospitals, appointment_date, appointment_time, status, token_number, created_at, updated_at`

## queue_tokens `[Phase 6]`
`id, appointment_id -> appointments, hospital_id -> hospitals, doctor_id -> doctors, patient_id -> users, token_number, status, created_at, called_at, completed_at`
Status enum: `WAITING | CALLED | IN_CONSULTATION | COMPLETED | SKIPPED | CANCELLED`

## ambulances `[Phase 8]`
`id, hospital_id -> hospitals, driver_id -> users, vehicle_number, status, latitude, longitude, last_location_update`
Status enum: `AVAILABLE | ON_TRIP | OFFLINE | MAINTENANCE`

## ambulance_requests `[Phase 8]`
`id, patient_id -> users, ambulance_id -> ambulances, hospital_id -> hospitals, pickup_latitude, pickup_longitude, destination_hospital_id -> hospitals, status, requested_at, accepted_at, arrived_at, completed_at`
Status enum: `REQUESTED | ACCEPTED | GOING_TO_PATIENT | ARRIVED_AT_PATIENT | GOING_TO_HOSPITAL | ARRIVED_AT_HOSPITAL | COMPLETED | CANCELLED`

## ambulance_locations `[Phase 8]`
`id, ambulance_id -> ambulances, latitude, longitude, timestamp`
Only populated during an active trip (see privacy note in root README / spec section 33).

## notifications `[Phase 5 / 7]`
`id, user_id -> users, title, message, type, read, created_at`

## hospital_updates `[Phase 5]`
`id, hospital_id -> hospitals, resource_type, resource_id, action, updated_by -> users, created_at`

## audit_logs `[Phase 9]`
`id, user_id -> users, hospital_id -> hospitals, action, entity_type, entity_id, old_value, new_value, created_at`
