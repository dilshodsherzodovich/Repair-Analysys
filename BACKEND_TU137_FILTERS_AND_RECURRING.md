# TU-137: server-side filters and recurring remarks — backend request

Date: 2026-11-24
Frontend pages: `/tu-137` (list) and `/tu-137/reports` (mashinist report)
Endpoint used by both pages: `GET /api/tu137/integration/`

## Why

The frontend now has a date range, a responsible-organization filter, a mashinist-name
search and a "recurring remarks" (povtor) view on both TU-137 pages. **None of this exists
in the backend yet**, so the frontend currently does it in the browser: it loads up to
`page_size=500` records of the depo and filters/aggregates them locally.

That works only while a depo has ≤ 500 records and it moves a lot of data for every page
view. Please add the server-side support below; the frontend will switch to it and drop the
500-record workaround.

## 1. New / confirmed query params on `GET /api/tu137/integration/`

| Param | Type | Status | Description |
|---|---|---|---|
| `depo_id` | int | exists | Depo the records belong to. |
| `status` | `1..4`, comma-separated | **confirm for this endpoint** | Replaces the old `finished` (see `FRONTEND_TU137_STATUS_CHANGES.md`). The frontend still sends `finished` today. |
| `responsible_organization` | int | exists (name only) | Responsible organization (SHCH, PCH, ...). **Please confirm it filters `resp_organization.id`**, and whether it should also include the organization's children (an ECH-style parent → child filter). |
| `created_from` | `YYYY-MM-DD` | **new** | `created_at >= created_from 00:00:00`. |
| `created_to` | `YYYY-MM-DD` | **new** | `created_at <= created_to 23:59:59.999` — the **whole last day must be included**. |
| `search` | string | **new** | Case-insensitive `icontains` on the mashinist name (`create_user_fio`). Nice to have: also locomotive name and `comments`. |
| `is_repeat` | bool | **new** | `true` → only records that are recurring (definition in §3). |
| `ordering` | string | optional | `created_at`, `-created_at` (default newest first). |
| `page`, `page_size` | int | exists | Keep `page_size` max ≥ 500 until the frontend has switched. |

All filters combine with AND. `count` in the paginated response must reflect the filters.

Date naming: other journals in this project use `fromDate` / `toDate` (`ech-revision-journal`,
`revision-journal`). If you prefer consistency with them, use those names instead of
`created_from` / `created_to` — just tell the frontend which one.

## 2. New response fields on each TU-137 record

| Field | Type | Description |
|---|---|---|
| `is_repeat` | bool | `true` when the record is part of a recurring group (§3). |
| `repeat_count` | int | Number of records in its recurring group, **including itself** (1 = not recurring). |

The list page uses them for the "Takror ×N" badge. Today the frontend counts this itself
over the loaded records.

## 3. Definition of "recurring" (povtor)

Agreed on the frontend side as a first version — **please confirm or correct**:

> Two or more records of the **same depo** with the **same `group_id`** (remark group) at the
> **same place** (`station_code` + `station2_code`; for a stretch both stations).

- The group is counted over **all records of the depo** (any status), not over the currently
  filtered page — a record stays "recurring" even if its siblings are filtered out. If you
  would rather count within the selected date range, say so.
- Optional refinement to discuss: same locomotive (`lokomotiv_name`) instead of / in addition
  to the station.

## 4. New endpoint for the recurring report

The reports page shows a "Recurring remarks" table: one row per recurring group, expandable
to its records. A dedicated endpoint avoids sending every record just to aggregate them.

```
GET /api/tu137/integration/recurring/
```

Query params: `depo_id` (required), `responsible_organization`, `created_from`, `created_to`,
`search`, `status` — same meaning as in §1. Not paginated (or paginate by group).

Response `200` — sorted by `count` descending, groups with `count >= 2` only:

```json
[
  {
    "group_id": 12,
    "group_name": "Peregon speed restriction",
    "station_name": "Station A",
    "station2_name": "Station B",
    "station_code": "720001",
    "station2_code": "720002",
    "count": 5,
    "open_count": 2,
    "records": [
      {
        "id": 7016,
        "create_user_fio": "Karimov A.",
        "mashinist_id": 101,
        "lokomotiv_name": "VL-001",
        "resp_organization": { "id": 3, "name": "PCH-1", "emm_id": 3 },
        "status": 1,
        "status_display": "Created",
        "comments": "…",
        "created_at": "2026-11-20T09:31:02+05:00"
      }
    ]
  }
]
```

`records` use the same shape as the list items (a subset is enough), newest first.

## 5. Mashinist name in exports

The frontend Word export (`Mashinist ID: …` → `Mashinist: <name>`) now uses
`create_user_fio`. Please make sure `create_user_fio` is **never empty** for records of known
mashinists; when it is empty the export falls back to `#<mashinist_id>`.

## 6. Related items that are also still open on the backend

These came up in the same iteration and need a backend decision/implementation:

1. **MPR journal export** — `GET /api/mpr-journal/export-excel/` ignores the new
   `confirm_status` filter. Should it accept `confirm_status` (comma-separated, like the list)?
2. **`sriv_moderator` access to `/api/mpr-journal/`** — the frontend now gives
   `sriv_moderator` the same permissions as `repair_engineer` on the MPR / Brak / Defekt
   page (view, create, edit, delete). The API must **scope rows to the user's own
   organization** for this role (list, retrieve, update, delete, and the statistics endpoints
   `mpr-journal/statistics/`). The frontend hides the organization picker for them and relies
   on the backend for the restriction.
3. **`GET /api/ech-organizations/`** is used by the ECH journal filter (`ech_admin`, `admin`)
   per the ECH guide — please confirm it is deployed on the environment the frontend points to
   (`app3.kulmatoff.uz`).

## 7. Acceptance checklist

- [ ] `created_from` / `created_to` (or `fromDate` / `toDate`) filter by `created_at`, last day inclusive.
- [ ] `search` matches the mashinist name case-insensitively.
- [ ] `responsible_organization` filters by `resp_organization.id` (decision on children).
- [ ] `is_repeat` filter and `is_repeat` / `repeat_count` fields on records.
- [ ] `GET /api/tu137/integration/recurring/` implemented as in §4.
- [ ] `count`, `next`, `previous` correct with every filter combination.
- [ ] `status` filter works on `/integration/`.
- [ ] §6 items answered.
