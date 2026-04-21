# Server test plan

This project currently has no pytest configuration, so we will start with **Django's built-in test runner**.

## How tests are run

From the repo root:

```bash
cd server
.venv/bin/python manage.py test
```

Run a subset (examples):

```bash
cd server
.venv/bin/python manage.py test tests
.venv/bin/python manage.py test tests.test_health
.venv/bin/python manage.py test tests.api.test_auth
```

Notes:

- Tests run against Django's test database (SQLite by default per `config.settings` unless `DATABASE_BACKEND` is set).
- For deterministic results, tests should not rely on external services.

## Tests directory layout

All server tests live under `server/tests/` as a single top-level test package. We’ll organize by domain to mirror the API/modules:

```
server/tests/
  __init__.py
  test_plan.md

  conftest.py                 # shared helpers/fixtures (when needed)

  test_health.py              # basic sanity checks

  api/
    __init__.py
    test_auth.py              # /api/auth/* endpoints
    test_collectives.py       # /api/collectives/* endpoints
    test_memberships.py       # /api/collective-memberships/* endpoints
    test_users.py             # /api/users/* endpoints

  permissions/
    __init__.py
    test_collective_permissions.py
    test_user_permissions.py
```

Guidelines:

- Prefer **black-box API tests** (HTTP requests) for endpoint behavior.
- Add **unit tests** for pure permission/builder logic (fast, isolated).
- Keep test names and file names explicit: `test_<topic>.py`.

## Initial tests to add (first batch)

These are the first tests we will implement next, in roughly this order.

### 1) Health/smoke test

- `tests/test_health.py`
  - **Goal**: ensure the Django app boots and the Ninja API root is reachable.
  - **Checks**: a simple request using Django’s test client returns a non-500 response.

### 2) Auth API basics

- `tests/api/test_auth.py`
  - **Login**: valid credentials return access/refresh tokens.
  - **Login failure**: invalid credentials return 401.
  - **Current user** (if exposed): authenticated request returns the expected user shape.

### 3) Collectives API basics

- `tests/api/test_collectives.py`
  - **Create collective**: authenticated user can create; response includes `slug` and expected defaults.
  - **List/detail visibility**: public collectives visible to anonymous users; private collectives are not.
  - **Slug behavior**: slugs are unique; invalid slugs rejected (if validated by schema/model).

### 4) Membership flows

- `tests/api/test_memberships.py`
  - **Join**: join rules enforced (open vs approval-only, etc. as implemented).
  - **Leave**: member can leave; non-member cannot.
  - **Role checks**: owner/admin vs regular member permissions for membership management endpoints.

### 5) Permission unit tests (fast)

- `tests/permissions/test_collective_permissions.py`
  - **Viewer-based access**: `can_view_*` style rules return correct values for anonymous/member/admin.

- `tests/permissions/test_user_permissions.py`
  - **Self vs other**: viewing/editing user details respects the intended rules.

## Definition of done for the first iteration

- `server/tests/` exists and tests run in CI/dev with `manage.py test`.
- First batch focuses on **critical authentication and visibility** behavior.
- Tests are deterministic and don’t require external services.
