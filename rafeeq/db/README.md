# Rafeeq — database and dataset

A live Postgres database on Supabase, with a synthetic dataset. The point of the
schema is not the tables; it is that the three promises the app makes to a
patient are enforced **by the database**, where a change to the front-end cannot
quietly undo them.

```
Project   rafeeq · vhsplgffqjvtcxfaxexw
API       https://vhsplgffqjvtcxfaxexw.supabase.co
Key       sb_publishable_x44HGhaUzkMUXeTQG4p54A_6ECSLwz3   (publishable — safe in a browser)
Region    eu-central-1 (Frankfurt)
```

The publishable key is meant to be public; it identifies the project and grants
nothing on its own. Every table below is protected by row-level security, which
is what actually decides who reads what. There is no secret key in this
repository and there must never be one.

Health data belongs in its own database, so this is a separate project from
`darseen` rather than another schema inside it.

---

## The three rules, and where each one lives

**1. A patient's record is theirs.**
Every patient table carries a policy of the form `patient_id = my_patient_id()`.
A signed-in stranger reading `patients`, `alerts`, `band_readings` or
`phq9_responses` gets zero rows — not a filtered list, zero.

**2. A clinician sees a patient only while that patient has added them.**
`care_team` is the only route. Deleting the row ends the access in the same
instant. There is deliberately no "staff can see everyone" policy anywhere in
the schema.

**3. The supply side cannot reach the patient side.**
`supply_reports` has no `patient_id`, no `user_id`, and no foreign key into any
patient table — verified by querying `information_schema`, not by reading the
code. There is no column to join on, so there is nothing to switch off later.
Anyone may file a report; only named `drug_control_staff` may read one, and
nobody may add themselves to that table through the API.

### Verified, not asserted

Run as a signed-in user who is nobody:

| Query | Rows |
|---|---|
| `select count(*) from patients` | **0** |
| `select count(*) from alerts` | **0** |
| `select count(*) from band_readings` | **0** |
| `select count(*) from phq9_responses` | **0** |
| `select count(*) from supply_reports` | **0** |
| `select count(*) from substances` | 13 — public clinical reference, on purpose |
| `select count(*) from clinicians` | 12 — public, minus the licence number |

As the patient: 1 patient row, their own 3 mood checks, their own 168 readings,
0 supply reports. As their prescriber: the 24 patients who added them, their
alerts, and still 0 supply reports.

---

## Data model

**Clinical reference** — world-readable, because someone in trouble at 3am
should not need an account to read a phone number.
`substances` · `substance_timeline` · `substance_medications` ·
`substance_signals` · `plan_phases` · `plan_phase_steps` · `band_signatures` ·
`alert_rules` · `crisis_lines` · `treatment_centres` · `volunteer_orgs` ·
`aftercare_schedule`

**People** — `clinicians` (licence number withheld from the public grant;
`licence_verified` stays false until checked against a register) ·
`clinician_substances` · `on_call_shifts` (two a day, twelve hours each, with a
named backup).

**The patient record** — `patients` · `care_team` · `patient_substances` ·
`intake_answers` · `plans` · `plan_progress` · `bands` · `band_readings` ·
`detections` · `alerts` · `phq9_responses` · `patient_messages`.

**Supply** — `supply_reports` · `drug_control_staff`, joined to nothing.

**Views** — `supply_clusters` (a pattern needs no names) · `on_call_now` (before
08:00 it is still last night's doctor) · `alert_queue` (worst first).

### Constraints that carry an argument

| Constraint | Why it is there |
|---|---|
| `civil_id_hash ~ '^[0-9a-f]{64}$'` | Only a hash fits the column. Storing a raw Civil ID is impossible, not discouraged. |
| `confidence <= 0.97` on `detections` | Body signs identify a class, not a molecule. A readout printing 100% would get a patient accused over a fever. |
| `item9` generated from `phq9_responses` | The self-harm answer is pulled out on purpose: above zero must route to crisis help before a score is shown. |
| `alerts.source = 'self_report'` | An honest report is a note, never an alarm, and resets no phase. |
| `plans.status = 'returned'` | Not "relapsed". A return resumes the plan at the phase that fits. |

---

## The dataset

Synthetic, generated in SQL from a fixed seed, so a rebuild produces the same
numbers. No real person, no real Civil ID, no real clinical record.

| Table | Rows |
|---|---|
| patients | 40 |
| plans | 40 (9 must start under supervision) |
| care_team | 52 |
| bands | 40 |
| band_readings | 6,720 — 7 days, hourly, per patient |
| detections | 6 |
| alerts | 17 |
| phq9_responses | 120 — three per patient, 21 days apart |
| patient_messages | 12 |
| supply_reports | 12 |
| clinical reference | 13 substances, 52 phases, 161 steps, 12 clinicians, 56 shifts |

Vitals are a resting adult with a diurnal curve plus noise, and roughly one
patient in six carries an episode where a signature is applied to the reading
itself — so the classifier reads a pattern back out of data that genuinely
contains one, rather than out of a flag column.

Substance mix is weighted the way a Kuwaiti service would actually see it:
prescription opioids (12) and Captagon (8) lead, not heroin.

Mood improves under treatment — mean PHQ-9 **20.3 → 15.7 → 11.5** across the
three checks, with item-nine positives falling from 7 to 2. The first version of
the seed had this backwards and was rebuilt: a dataset showing patients getting
worse would have been a quietly wrong story to present.

### Questions it can answer

```sql
-- which sellers are worth a knock on a door
select * from supply_clusters order by reports desc;

-- who is awake right now
select * from on_call_now;

-- does the cohort improve
select round(avg(total),1), date_trunc('month', taken_at)
from phq9_responses group by 2 order by 2;

-- how many plans cannot start at home
select count(*) from plans where supervised_start;
```

---

## Rebuilding

Migrations are versioned in the Supabase project, newest last:

`reference_and_clinicians` → `patient_records_and_rls` →
`supply_reports_and_views` → `seed_clinical_reference` →
`seed_plans_clinicians_rota` → `seed_synthetic_cohort` → `seed_phq9_history` →
`fix_phq9_trend_direction` → `harden_helpers_and_staff_table`

`supabase db pull` writes them into `supabase/migrations/` locally.

## Still to do before a real patient

- The two policy helpers live in a `private` schema so PostgREST does not
  publish them as callable endpoints. Keep them there.
- `licence_verified` is false for all twelve clinicians. Nothing may present an
  unverified clinician as available to treat.
- `crisis_lines` holds one row with `verified = false`: the Drug Control
  reporting line. Do not display it until the number is confirmed.
- `drug_control_staff` is empty and has no INSERT policy. It stays empty until
  a real agreement exists.
- A lawful basis for holding health data in Kuwait, and clinical sign-off on
  every plan in the library.
