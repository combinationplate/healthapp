-- ============================================================================
-- 2026-09-03 — Refresh discipline_states to match HISC's current approvals
-- ----------------------------------------------------------------------------
-- Source: hiscornerstone.com WooCommerce product attributes (public Store API,
--   /wp-json/wc/store/v1/products/{id} → attributes), pulled 2026-09-03:
--     RN Approved (pa_rn)      = 50 states
--     SW-LCSW-LMSW (pa_sw)     = 49 states (all except New York)
--     CCM-ACM (pa_ccm)         = 50 states
--     PT Approved (pa_pt)      = 34 states
--     OT Approved (pa_ot)      = 27 states
--     SLP Approved (pa_slp-approved) = 8 states
--   (HISC also defines RD Approved = 50, NHA = 50, LPC, LVN — NOT loaded here
--   because Pulse has no matching discipline yet. Add later if Pulse adds them.)
--
-- BEFORE RUNNING: if the list you pull from the HISC project differs from the
-- arrays below, edit the arrays — they are the single place the data lives.
--
-- ⚠️ PT caveat: HISC lists FL / GA / LA as PT-approved. Pulse's July research
-- of the actual state rules concluded FL and LA do NOT accept TX-approved CE
-- and GA only partially (see claude/pt-ce-research-batch1.md). They are
-- INCLUDED below to mirror HISC — confirm the basis with Robyn before relying
-- on them in outreach, and note /free-ce/pt/* pages still say otherwise.
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → paste → Run. Idempotent
-- (safe to re-run). Replaces ONLY the six Pulse disciplines; other rows (if
-- any) are untouched. No temp tables / explicit transaction — the Supabase
-- SQL editor dropped the temp table before the insert ("relation
-- _new_approvals does not exist"), so everything is inlined below.
--
-- Optional: to preview what will change before running, run just this:
--   select profession, count(*) from discipline_states group by 1 order by 1;
-- ============================================================================


-- 1) Clear the six Pulse disciplines
delete from discipline_states
  where profession in ('Nursing','Social Work','Case Management','PT','OT','ST');

-- 2) Re-insert from one inline list of approvals
insert into discipline_states (profession, state)
with all_states(state) as (
  values
  ('Alabama'),('Alaska'),('Arizona'),('Arkansas'),('California'),('Colorado'),
  ('Connecticut'),('Delaware'),('Florida'),('Georgia'),('Hawaii'),('Idaho'),
  ('Illinois'),('Indiana'),('Iowa'),('Kansas'),('Kentucky'),('Louisiana'),
  ('Maine'),('Maryland'),('Massachusetts'),('Michigan'),('Minnesota'),
  ('Mississippi'),('Missouri'),('Montana'),('Nebraska'),('Nevada'),
  ('New Hampshire'),('New Jersey'),('New Mexico'),('New York'),
  ('North Carolina'),('North Dakota'),('Ohio'),('Oklahoma'),('Oregon'),
  ('Pennsylvania'),('Rhode Island'),('South Carolina'),('South Dakota'),
  ('Tennessee'),('Texas'),('Utah'),('Vermont'),('Virginia'),('Washington'),
  ('West Virginia'),('Wisconsin'),('Wyoming')
)
-- Nursing (ANCC): all 50
select 'Nursing', state from all_states
union all
-- Case Management (ACMA–CCMC reciprocity): all 50
select 'Case Management', state from all_states
union all
-- Social Work (ASWB ACE #2082): all except New York
select 'Social Work', state from all_states where state <> 'New York'
union all
-- PT (TX Board of PT Examiners approval + per-HISC acceptance): 34 states
select 'PT', unnest(array[
    'Alabama','Alaska','Arizona','Colorado','Florida','Georgia','Idaho',
    'Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Massachusetts',
    'Minnesota','Mississippi','Missouri','Montana','Nebraska','New Hampshire',
    'North Carolina','North Dakota','Oregon','Rhode Island','South Carolina',
    'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia',
    'Washington','Wisconsin','Wyoming'
  ])
union all
-- OT (TOTA approval + per-HISC acceptance): 27 states
select 'OT', unnest(array[
    'Alabama','Alaska','Arizona','Arkansas','Colorado','Connecticut',
    'Florida','Georgia','Iowa','Kansas','Kentucky','Louisiana','Maine',
    'Massachusetts','Michigan','Minnesota','Mississippi','Missouri',
    'Nebraska','Nevada','New Hampshire','New Jersey','North Dakota','Ohio',
    'Pennsylvania','Texas','Wisconsin'
  ])
union all
-- SLP — stored as 'ST' in Pulse (TSHA approval + per-HISC acceptance): 8 states
select 'ST', unnest(array[
    'Arizona','Colorado','Florida','Indiana','Kansas','Missouri',
    'Oklahoma','Texas'
  ]);

-- ── Verification (expect: Case Management 50 · Nursing 50 · OT 27 · PT 34 ·
--    Social Work 49 · ST 8) ──────────────────────────────────────────────────
select profession, count(*) as states
from discipline_states
group by profession
order by profession;

-- Spot-checks: SLP should show exactly 8; SW must NOT include New York
select state from discipline_states where profession = 'ST' order by state;
select count(*) as sw_new_york_rows -- expect 0
from discipline_states where profession = 'Social Work' and state = 'New York';
