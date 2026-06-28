# Bayt Al Taleb — API Documentation

REST API for the Bayt Al Taleb academic content platform.

- **Base URL:** `/api/v1`
- **Content type:** `application/json` (except file upload, which is `multipart/form-data`)
- **Health check:** `GET /health` → `{ "status": "ok", "service": "bayt-al-taleb", "env": "..." }`

---

## Conventions

### Response envelope

Every JSON response is wrapped in a uniform envelope.

**Success:**
```json
{ "success": true, "data": { /* payload */ } }
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": { "...": "optional, present for validation errors" }
  }
}
```

`204 No Content` responses have an empty body.

### Authentication

JWT Bearer tokens. Obtain them from `POST /auth/login` (or `/auth/register`), then send:

```
Authorization: Bearer <accessToken>
```

- **Access token** lifetime: ~15 minutes. **Refresh token**: ~7 days.
- When the access token expires, call `POST /auth/refresh` to obtain a new pair (refresh tokens are rotated on use).

### Authorization model (RBAC)

Roles: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `MEMBER`, `VISITOR`.

Most write endpoints require a **permission** (e.g. `files:upload`); a few admin endpoints require a **role** directly. `SUPER_ADMIN` implicitly holds every permission. Permission → roles that hold it:

| Permission | SUPER_ADMIN | ADMIN | MODERATOR | MEMBER | VISITOR |
|---|:--:|:--:|:--:|:--:|:--:|
| `users:read` | ✅ | ✅ | | | |
| `users:manage` | ✅ | | | | |
| `roles:read` | ✅ | | | | |
| `roles:assign` | ✅ | | | | |
| `moderators:manage` | ✅ | ✅ | | | |
| `majors:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `majors:manage` | ✅ | ✅ | ✅ | | |
| `scholarships:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `scholarships:manage` | ✅ | ✅ | ✅ | | |
| `content:manage` | ✅ | ✅ | ✅ | | |
| `files:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `files:upload` | ✅ | | | ✅ | |
| `files:manage` | ✅ | ✅ | | | |
| `files:review` | ✅ | | ✅ | | |
| `contact:submit` | ✅ | | | ✅ | ✅ |
| `contact:manage` | ✅ | ✅ | | | |

> **Ownership scoping:** `MODERATOR` actions are additionally restricted to the
> majors/scholarships **assigned** to them. A moderator with `majors:manage`
> can only manage majors they are assigned to (others return `403 FORBIDDEN`).
> `ADMIN`/`SUPER_ADMIN` bypass ownership checks.

### Error codes

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed request, bad file type, path issues |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token |
| 403 | `FORBIDDEN` | Authenticated but lacks permission/role/ownership |
| 404 | `NOT_FOUND` | Resource (or route) does not exist |
| 409 | `CONFLICT` | Unique constraint / invalid state transition |
| 422 | `VALIDATION_ERROR` | Request failed schema validation (`details` included) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

A `422` always includes `error.details` (flattened field errors), e.g.:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": { "formErrors": [], "fieldErrors": { "email": ["Invalid email"] } }
  }
}
```

### Pagination

List endpoints accept `page` (default `1`) and `pageSize` (default `20`, max `100`; `50` for search) and return:
```json
{ "items": [ /* ... */ ], "total": 42, "page": 1, "pageSize": 20, "totalPages": 3 }
```

### Common enums

- **RoleName:** `SUPER_ADMIN` · `ADMIN` · `MODERATOR` · `MEMBER` · `VISITOR`
- **ContentEntityType / FileOwnerType:** `MAJOR` · `SCHOLARSHIP`
- **AuditEntityType:** `MAJOR` · `SCHOLARSHIP` · `FILE` · `SECTION` · `FAQ`
- **FileType:** `SUMMARY` · `PREVIOUS_EXAM` · `SYLLABUS` · `OTHER`
- **FileStatus:** `PENDING` · `APPROVED` · `REJECTED`
- **ReviewAction / AuditAction:** `APPROVE` · `REJECT` (+ `CREATE` · `UPDATE` · `DELETE` · `RESTORE` for audit)

IDs are CUIDs (e.g. `ckv1nursing0000000000000a`).

---

# Auth

Base path: `/api/v1/auth`. All endpoints are **public**.

### POST /auth/register
Register a new member account (always created with role `MEMBER`).

**Body**
| Field | Type | Rules |
|---|---|---|
| `email` | string | valid email |
| `password` | string | 8–128 chars |
| `fullName` | string | 2–120 chars |

**`201 Created`**
```json
{
  "success": true,
  "data": {
    "user": { "id": "ckuser...", "email": "sara@example.com", "fullName": "Sara A.", "role": "MEMBER" },
    "tokens": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
  }
}
```
**Errors:** `409 CONFLICT` (email already registered), `422 VALIDATION_ERROR`.

### POST /auth/login
**Body:** `{ "email": string, "password": string }`
**`200 OK`** — same shape as register.
**Errors:** `401 UNAUTHORIZED` (invalid credentials or inactive user), `422`.

### POST /auth/refresh
Rotate tokens using a valid refresh token.
**Body:** `{ "refreshToken": string }` (min 10 chars)
**`200 OK`** — same shape as register (new token pair).
**Errors:** `401 UNAUTHORIZED` (invalid/expired/revoked refresh token), `422`.

### POST /auth/logout
Revoke a refresh token.
**Body:** `{ "refreshToken": string }`
**`204 No Content`**

---

# Users

Base path: `/api/v1/users`. **All require authentication.**

### GET /users
List users. **Permission:** `users:read` (SUPER_ADMIN, ADMIN).
**Query:** `page`, `pageSize`.
**`200 OK`**
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "ckuser...", "email": "sara@example.com", "fullName": "Sara A.",
        "role": "MEMBER", "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z" }
    ],
    "total": 1, "page": 1, "pageSize": 20, "totalPages": 1
  }
}
```

### GET /users/:id
**Permission:** `users:read`. **Path:** `id` (cuid).
**`200 OK`** → `{ "success": true, "data": { /* UserDto */ } }`
**Errors:** `404 NOT_FOUND`.

### POST /users
Create a user with a chosen role. **Permission:** `users:manage` (SUPER_ADMIN).
**Body**
| Field | Type | Rules |
|---|---|---|
| `email` | string | valid email |
| `password` | string | 8–128 |
| `fullName` | string | 2–120 |
| `role` | RoleName | enum |

**`201 Created`** → `{ "success": true, "data": { /* UserDto */ } }`
**Errors:** `409 CONFLICT` (duplicate email), `404 NOT_FOUND` (role missing), `422`.

### PATCH /users/:id
Update profile / active flag. **Permission:** `users:manage`.
**Body** (≥1 field): `{ "fullName"?: string(2–120), "isActive"?: boolean }`
**`200 OK`** → updated `UserDto`. **Errors:** `404`, `422`.

---

# Roles

Base path: `/api/v1/roles`. **All require authentication.**

### GET /roles
List the role catalogue with permission keys. **Permission:** `roles:read` (SUPER_ADMIN).
**`200 OK`**
```json
{
  "success": true,
  "data": [
    { "id": "ckrole...", "name": "MODERATOR", "description": null,
      "permissions": ["majors:read", "majors:manage", "files:review"] }
  ]
}
```

### PUT /roles/:userId/assign
Assign a role to a user (triggers a role-change notification). **Permission:** `roles:assign` (SUPER_ADMIN).
**Path:** `userId` (cuid). **Body:** `{ "role": RoleName }`
**`204 No Content`**. **Errors:** `404 NOT_FOUND` (role/user), `422`.

---

# Colleges

Base path: `/api/v1/colleges`. Reads are **public**; writes require `majors:manage` (SUPER_ADMIN, ADMIN, MODERATOR).

### GET /colleges
**Public.** **Query:** `page`, `pageSize`.
**`200 OK`** — paginated list of:
```json
{ "id": "ckcol...", "slug": "engineering", "name": "Engineering",
  "description": "Faculty of Engineering", "isActive": true,
  "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" }
```

### GET /colleges/:id
**Public.** **`200 OK`** → one college. **Errors:** `404`.

### GET /colleges/:id/majors
The **College → Majors** hierarchy. **Public.** **Query:** `page`, `pageSize`.
**`200 OK`** — paginated list of majors (see Majors). **Errors:** `404` (unknown college).

### POST /colleges
**Permission:** `majors:manage`.
**Body**
| Field | Type | Rules |
|---|---|---|
| `slug` | string | kebab-case, 2–120 |
| `name` | string | 2–200 |
| `description` | string? | ≤2000 |
| `isActive` | boolean? | default `true` |

**`201 Created`** → CollegeDto. **Errors:** `409` (duplicate slug), `422`.

### PATCH /colleges/:id
**Permission:** `majors:manage`. **Body:** any of `slug`, `name`, `description`, `isActive` (≥1).
**`200 OK`** → updated. **Errors:** `404`, `409`, `422`.

### DELETE /colleges/:id
**Permission:** `majors:manage`. Hard-deletes a college **only if it has no majors**.
**`204 No Content`**. **Errors:** `404`, `409 CONFLICT` (still has majors).

---

# Majors

Base path: `/api/v1/majors`. Reads **public**; writes require `majors:manage`. Rich content (sections/FAQs) lives under `/content/MAJOR/:id/...`.

### GET /majors
**Public.** **Query:** `page`, `pageSize`. Soft-deleted majors are excluded.
**`200 OK`** — paginated list of:
```json
{ "id": "ckmaj...", "slug": "nursing", "name": "Nursing", "isActive": true,
  "collegeId": "ckcol...", "createdAt": "2026-01-01T00:00:00.000Z" }
```

### GET /majors/:id
**Public.** **`200 OK`** → one major. **Errors:** `404`.

### POST /majors
**Permission:** `majors:manage`.
**Body**
| Field | Type | Rules |
|---|---|---|
| `slug` | string | kebab-case, 2–120 |
| `name` | string | 2–200 |
| `isActive` | boolean? | default `true` |
| `collegeId` | string \| null? | cuid; groups the major under a college |

**`201 Created`** → MajorDto. **Errors:** `404` (collegeId not found), `409` (duplicate slug), `422`.

### PATCH /majors/:id
**Permission:** `majors:manage`. **Body:** any of `slug`, `name`, `isActive`, `collegeId` (≥1).
**`200 OK`** → updated. **Errors:** `403` (moderator not assigned), `404`, `409`, `422`.

### DELETE /majors/:id
Soft delete (hidden from public APIs, enters the Deleted Items queue). **Permission:** `majors:manage`.
**Body:** `{ "reason"?: string(≤2000) }`
**`204 No Content`**. **Errors:** `403`, `404`.

---

# Scholarships

Base path: `/api/v1/scholarships`. Reads **public**; writes require `scholarships:manage`. Identical shape to Majors (without `collegeId`).

### GET /scholarships
**Public.** **Query:** `page`, `pageSize`.
**`200 OK`** — paginated list of:
```json
{ "id": "cksch...", "slug": "ministry-grant", "name": "Ministry Grant",
  "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z" }
```

### GET /scholarships/:id
**Public.** **`200 OK`** → one scholarship. **Errors:** `404`.

### POST /scholarships
**Permission:** `scholarships:manage`.
**Body:** `{ "slug": kebab(2–120), "name": string(2–200), "isActive"?: boolean }`
**`201 Created`**. **Errors:** `409` (duplicate slug), `422`.

### PATCH /scholarships/:id
**Permission:** `scholarships:manage`. **Body:** any of `slug`, `name`, `isActive` (≥1).
**`200 OK`**. **Errors:** `403`, `404`, `409`, `422`.

### DELETE /scholarships/:id
Soft delete. **Permission:** `scholarships:manage`. **Body:** `{ "reason"?: string }`.
**`204 No Content`**. **Errors:** `403`, `404`.

---

# Content (Polymorphic Sections & FAQs)

Base path: `/api/v1/content/:entityType/:entityId/...` where `entityType` ∈ `MAJOR | SCHOLARSHIP` and `entityId` is the owner's cuid. Reads **public**; writes require `content:manage` (SUPER_ADMIN, ADMIN, MODERATOR — moderators scoped to assigned owners).

## Sections

### GET /content/:entityType/:entityId/sections
**Public.** **`200 OK`**
```json
{
  "success": true,
  "data": [
    { "id": "cksec...", "entityType": "MAJOR", "entityId": "ckmaj...",
      "title": "Overview", "content": "…", "sortOrder": 0,
      "createdAt": "2026-01-01T00:00:00.000Z" }
  ]
}
```
**Errors:** `404` (owner not found).

### POST /content/:entityType/:entityId/sections
**Permission:** `content:manage`.
**Body:** `{ "title": string(1–200), "content": string(≥1), "sortOrder"?: int≥0 }`
**`201 Created`** → SectionDto. **Errors:** `403`, `404`, `422`.

### PATCH /content/:entityType/:entityId/sections/:id
**Permission:** `content:manage`. **Body:** any of `title`, `content`, `sortOrder` (≥1).
**`200 OK`**. **Errors:** `403`, `404`, `422`.

### DELETE /content/:entityType/:entityId/sections/:id
Soft delete. **Permission:** `content:manage`. **`204 No Content`**. **Errors:** `403`, `404`.

## FAQs

### GET /content/:entityType/:entityId/faqs
**Public.** **`200 OK`** — array of:
```json
{ "id": "ckfaq...", "entityType": "MAJOR", "entityId": "ckmaj...",
  "question": "Is there a fee?", "answer": "No.", "sortOrder": 0,
  "createdAt": "2026-01-01T00:00:00.000Z" }
```

### POST /content/:entityType/:entityId/faqs
**Permission:** `content:manage`.
**Body:** `{ "question": string(1–300), "answer": string(≥1), "sortOrder"?: int≥0 }`
**`201 Created`** → FaqDto.

### PATCH /content/:entityType/:entityId/faqs/:id
**Permission:** `content:manage`. **Body:** any of `question`, `answer`, `sortOrder` (≥1). **`200 OK`**.

### DELETE /content/:entityType/:entityId/faqs/:id
Soft delete. **Permission:** `content:manage`. **`204 No Content`**.

---

# Files

Base path: `/api/v1/files`. Uploads are `multipart/form-data`; everything else is JSON.

**Allowed upload types:** PDF, DOC, DOCX, PPT, PPTX, ZIP. Max size configurable (default 25 MB). The server validates extension + MIME + size and rejects double extensions / executables / path traversal.

### GET /files
List files. **Auth required. Permission:** `files:read`.
**Query:** `status?` (FileStatus), `type?` (FileType), `mine?` (boolean — only the caller's uploads), `page`, `pageSize`.
**`200 OK`** — paginated list of:
```json
{ "id": "ckfile...", "title": "Anatomy Summary", "description": null,
  "type": "SUMMARY", "status": "PENDING", "storageKey": "MAJOR/ckmaj.../uuid.pdf",
  "mimeType": "application/pdf", "sizeBytes": 20480,
  "ownerType": "MAJOR", "ownerId": "ckmaj...", "uploadedById": "ckuser...",
  "createdAt": "2026-01-01T00:00:00.000Z" }
```

### GET /files/owner/:ownerType/:ownerId
All non-deleted files for an owner. **Permission:** `files:read`.
**Path:** `ownerType` (`MAJOR|SCHOLARSHIP`), `ownerId` (cuid).
**`200 OK`** → array of FileDto.

### GET /files/owner/:ownerType/:ownerId/approved
Only `APPROVED` files for an owner (public-facing set). **Permission:** `files:read`.
**`200 OK`** → array of FileDto.

### GET /files/:id
**Permission:** `files:read`. **`200 OK`** → one FileDto. **Errors:** `404`.

### GET /files/:id/download
Download the binary. **Optional auth** (send a token for non-approved files).
- `APPROVED` files: **public** (no auth needed).
- `PENDING` / `REJECTED`: only the **uploader** or a **moderator/admin** assigned to the owner.

**`200 OK`** — binary stream with `Content-Type` + `Content-Disposition: attachment; filename="…"`.
**Errors:** `403 FORBIDDEN` (not allowed for this status), `404 NOT_FOUND`.

### POST /files
Upload a file. **Permission:** `files:upload` (MEMBER, SUPER_ADMIN). `multipart/form-data`.
A file is created with status `PENDING`; the uploader is auto-notified on approval/rejection.

**Form fields**
| Field | Type | Rules |
|---|---|---|
| `file` | binary | the file (Multer field name `file`) |
| `title` | string | 1–200 |
| `description` | string? | ≤2000 |
| `type` | FileType | enum |
| `ownerType` | FileOwnerType | `MAJOR \| SCHOLARSHIP` |
| `ownerId` | string | cuid of the owner |

**Example (curl):**
```bash
curl -X POST /api/v1/files \
  -H "Authorization: Bearer <token>" \
  -F "file=@anatomy.pdf;type=application/pdf" \
  -F "title=Anatomy Summary" -F "type=SUMMARY" \
  -F "ownerType=MAJOR" -F "ownerId=ckmaj..."
```
**`201 Created`** → FileDto (status `PENDING`).
**Errors:** `400 BAD_REQUEST` (no file / bad type / oversized / double extension), `403` (moderator not assigned to owner), `404` (owner not found), `422`.

### DELETE /files/:id
Soft delete + purge the binary from storage. **Permission:** `files:manage` (SUPER_ADMIN, ADMIN).
**Body:** `{ "reason"?: string }`. **`204 No Content`**. **Errors:** `403`, `404`.

---

# Reviews

Base path: `/api/v1/files/:fileId/reviews`. **All require authentication.** Approving/rejecting auto-notifies the uploader; only `PENDING` files can be reviewed.

### POST /files/:fileId/reviews
Approve or reject a file. **Permission:** `files:review` (SUPER_ADMIN, MODERATOR — scoped to assigned owners).
**Path:** `fileId` (cuid).
**Body:** `{ "action": "APPROVE" | "REJECT", "comment"?: string(≤2000) }`
**`201 Created`**
```json
{
  "success": true,
  "data": { "id": "ckrev...", "fileId": "ckfile...", "reviewerId": "ckuser...",
            "action": "APPROVE", "comment": null, "createdAt": "2026-01-01T00:00:00.000Z" }
}
```
**Errors:** `403` (not assigned), `404` (file), `409 CONFLICT` (file not PENDING), `422`.

### GET /files/:fileId/reviews
Review history for a file (audit trail). **Permission:** `files:read`.
**`200 OK`** → array of review objects (newest first). **Errors:** `403`, `404`.

---

# Search

Base path: `/api/v1/search`. **Public, read-only** global search (PostgreSQL full-text), ranked by relevance.

### GET /search
**Query**
| Param | Type | Notes |
|---|---|---|
| `q` | string | **required**, 1–200 chars |
| `type` | enum? | `major \| scholarship \| file` (singular filter) |
| `types` | string? | comma-separated, e.g. `major,scholarship` |
| `page` | int? | default 1 |
| `pageSize` | int? | default 20, max 50 |

**`200 OK`**
```json
{
  "success": true,
  "data": {
    "query": "engineering",
    "hits": [
      { "type": "major", "id": "ckmaj...", "title": "Engineering", "slug": "engineering", "score": 0.0607 },
      { "type": "file",  "id": "ckfile...", "title": "Engineering Notes", "score": 0.0304 }
    ],
    "total": 2, "page": 1, "pageSize": 20
  }
}
```
`slug` is present for `major`/`scholarship` hits, omitted for `file`. **Errors:** `422` (missing `q` / invalid type).

---

# Contact

Base path: `/api/v1/contact`.

### POST /contact
Submit a contact message. **Public.**
**Body**
| Field | Type | Rules |
|---|---|---|
| `name` | string | 2–120 |
| `email` | string | valid email |
| `subject` | string | 2–200 |
| `message` | string | 5–5000 |

**`201 Created`**
```json
{
  "success": true,
  "data": { "id": "ckmsg...", "name": "Sara", "email": "sara@example.com",
            "subject": "Question", "message": "…", "isHandled": false,
            "createdAt": "2026-01-01T00:00:00.000Z" }
}
```

### GET /contact
Admin inbox. **Auth required. Permission:** `contact:manage` (SUPER_ADMIN, ADMIN).
**Query:** `handled?` (boolean), `page`, `pageSize`.
**`200 OK`** — paginated list of contact messages.

### PATCH /contact/:id/handle
Mark a message handled. **Permission:** `contact:manage`. **Path:** `id` (cuid).
**`200 OK`** → updated message. **Errors:** `404`.

---

# Notifications

Base path: `/api/v1/notifications`. **All require authentication.** In-app notifications (auto-generated on file approval/rejection/restore and role changes).

### GET /notifications
The caller's own notifications, paginated. **Query:** `page`, `pageSize`.
**`200 OK`** — paginated list of:
```json
{ "id": "cknotif...", "userId": "ckuser...", "title": "File approved",
  "message": "Your file has been approved", "isRead": false,
  "metadata": { "fileId": "ckfile...", "status": "APPROVED" },
  "createdAt": "2026-01-01T00:00:00.000Z" }
```

### GET /notifications/unread-count
**`200 OK`** → `{ "success": true, "data": { "unreadCount": 3 } }`

### PATCH /notifications/read-all
Mark all of the caller's notifications read.
**`200 OK`** → `{ "success": true, "data": { "updated": 5 } }`

### PATCH /notifications/:id/read
Mark a single notification read. **Path:** `id` (cuid).
**`204 No Content`**. **Errors:** `404 NOT_FOUND` (not the caller's notification).

### POST /notifications
Create a system announcement. **Role required:** `ADMIN` or `SUPER_ADMIN`.
**Body**
| Field | Type | Rules |
|---|---|---|
| `title` | string | 1–200 |
| `message` | string | 1–5000 |
| `targetRole` | RoleName? | if set, broadcast to all users of that role |

**`201 Created`**
- Broadcast: `{ "success": true, "data": { "broadcast": true, "targetRole": "MODERATOR", "sent": 3 } }`
- Self-addressed (no `targetRole`): `{ "success": true, "data": { "broadcast": false, "sent": 1 } }`

**Errors:** `403 FORBIDDEN` (not admin), `422`.

---

# Audit Logs

Base path: `/api/v1/audit-logs`. **Role required:** `ADMIN` or `SUPER_ADMIN`. Read-only.

### GET /audit-logs
Paginated, filterable audit trail (newest first).
**Query**
| Param | Type | Notes |
|---|---|---|
| `entityType` | AuditEntityType? | `MAJOR \| SCHOLARSHIP \| FILE \| SECTION \| FAQ` |
| `entityId` | string? | cuid |
| `action` | AuditAction? | `CREATE \| UPDATE \| DELETE \| RESTORE \| APPROVE \| REJECT` |
| `userId` | string? | cuid (the actor) |
| `page`, `pageSize` | int? | |

**`200 OK`**
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "ckaud...", "userId": "ckuser...", "action": "APPROVE",
        "entityType": "FILE", "entityId": "ckfile...", "reason": null,
        "metadata": { "reviewId": "ckrev...", "newStatus": "APPROVED" },
        "createdAt": "2026-01-01T00:00:00.000Z" }
    ],
    "total": 1, "page": 1, "pageSize": 20, "totalPages": 1
  }
}
```
**Errors:** `401`, `403`.

---

# Deleted Items

Base path: `/api/v1/deleted-items`. **Role required:** `SUPER_ADMIN`. Manages the soft-delete queue across majors, scholarships, files, sections, FAQs.

### GET /deleted-items
The deleted-items queue (newest-deleted first). **Query:** `entityType?` (AuditEntityType filter).
**`200 OK`**
```json
{
  "success": true,
  "data": [
    { "entityType": "FILE", "id": "ckfile...", "label": "Anatomy Summary",
      "deletedAt": "2026-02-01T00:00:00.000Z", "deletedById": "ckadmin...",
      "deleteReason": "duplicate" }
  ]
}
```

### POST /deleted-items/:entityType/:id/restore
Restore a soft-deleted item (FILE restores notify the uploader).
**Path:** `entityType` (AuditEntityType), `id` (cuid).
**`204 No Content`**. **Errors:** `400 BAD_REQUEST` (unsupported entityType), `404` (no deleted item with that id).

### DELETE /deleted-items/:entityType/:id
Permanently (physically) delete an item — **irreversible**.
**Body:** `{ "reason"?: string(≤2000) }`.
**`204 No Content`**. **Errors:** `400`, `404`.

---

# Dashboard

Base path: `/api/v1/dashboard`. **Role required:** `ADMIN` or `SUPER_ADMIN`. Read-only aggregates.

### GET /dashboard/stats
Platform-wide counts. Soft-deleted rows are excluded from active totals; `deletedItems` comes from the deleted-items system.
**`200 OK`**
```json
{
  "success": true,
  "data": {
    "totalUsers": 120,
    "totalMajors": 18,
    "totalColleges": 5,
    "totalScholarships": 9,
    "totalFiles": 240,
    "pendingFiles": 12,
    "approvedFiles": 210,
    "rejectedFiles": 18,
    "deletedItems": 7,
    "totalContactMessages": 44,
    "unhandledContactMessages": 6
  }
}
```

### GET /dashboard/recent-activity
Latest 10 records per category.
**`200 OK`**
```json
{
  "success": true,
  "data": {
    "recentUploads": [
      { "id": "ckfile...", "title": "Notes", "type": "SUMMARY", "status": "PENDING",
        "ownerType": "MAJOR", "ownerId": "ckmaj...", "uploadedById": "ckuser...",
        "createdAt": "2026-02-01T00:00:00.000Z" }
    ],
    "recentAuditLogs": [
      { "id": "ckaud...", "userId": "ckuser...", "action": "CREATE",
        "entityType": "FILE", "entityId": "ckfile...", "createdAt": "2026-02-01T00:00:00.000Z" }
    ],
    "recentDeletedItems": [
      { "entityType": "MAJOR", "id": "ckmaj...", "label": "Old Major",
        "deletedAt": "2026-02-01T00:00:00.000Z", "deletedById": "ckadmin..." }
    ],
    "recentContactMessages": [
      { "id": "ckmsg...", "name": "Sara", "email": "sara@example.com",
        "subject": "Hi", "isHandled": false, "createdAt": "2026-02-01T00:00:00.000Z" }
    ]
  }
}
```
**Errors:** `401`, `403`.

---

## Endpoint index

| Module | Method & Path | Auth | Required |
|---|---|---|---|
| Auth | `POST /auth/register` | public | — |
| Auth | `POST /auth/login` | public | — |
| Auth | `POST /auth/refresh` | public | — |
| Auth | `POST /auth/logout` | public | — |
| Users | `GET /users` | yes | `users:read` |
| Users | `GET /users/:id` | yes | `users:read` |
| Users | `POST /users` | yes | `users:manage` |
| Users | `PATCH /users/:id` | yes | `users:manage` |
| Roles | `GET /roles` | yes | `roles:read` |
| Roles | `PUT /roles/:userId/assign` | yes | `roles:assign` |
| Colleges | `GET /colleges` | public | — |
| Colleges | `GET /colleges/:id` | public | — |
| Colleges | `GET /colleges/:id/majors` | public | — |
| Colleges | `POST /colleges` | yes | `majors:manage` |
| Colleges | `PATCH /colleges/:id` | yes | `majors:manage` |
| Colleges | `DELETE /colleges/:id` | yes | `majors:manage` |
| Majors | `GET /majors` | public | — |
| Majors | `GET /majors/:id` | public | — |
| Majors | `POST /majors` | yes | `majors:manage` |
| Majors | `PATCH /majors/:id` | yes | `majors:manage` |
| Majors | `DELETE /majors/:id` | yes | `majors:manage` |
| Scholarships | `GET /scholarships` | public | — |
| Scholarships | `GET /scholarships/:id` | public | — |
| Scholarships | `POST /scholarships` | yes | `scholarships:manage` |
| Scholarships | `PATCH /scholarships/:id` | yes | `scholarships:manage` |
| Scholarships | `DELETE /scholarships/:id` | yes | `scholarships:manage` |
| Content | `GET /content/:entityType/:entityId/sections` | public | — |
| Content | `POST /content/:entityType/:entityId/sections` | yes | `content:manage` |
| Content | `PATCH /content/:entityType/:entityId/sections/:id` | yes | `content:manage` |
| Content | `DELETE /content/:entityType/:entityId/sections/:id` | yes | `content:manage` |
| Content | `GET /content/:entityType/:entityId/faqs` | public | — |
| Content | `POST /content/:entityType/:entityId/faqs` | yes | `content:manage` |
| Content | `PATCH /content/:entityType/:entityId/faqs/:id` | yes | `content:manage` |
| Content | `DELETE /content/:entityType/:entityId/faqs/:id` | yes | `content:manage` |
| Files | `GET /files` | yes | `files:read` |
| Files | `GET /files/owner/:ownerType/:ownerId` | yes | `files:read` |
| Files | `GET /files/owner/:ownerType/:ownerId/approved` | yes | `files:read` |
| Files | `GET /files/:id` | yes | `files:read` |
| Files | `GET /files/:id/download` | optional | public if APPROVED |
| Files | `POST /files` | yes | `files:upload` |
| Files | `DELETE /files/:id` | yes | `files:manage` |
| Reviews | `POST /files/:fileId/reviews` | yes | `files:review` |
| Reviews | `GET /files/:fileId/reviews` | yes | `files:read` |
| Search | `GET /search` | public | — |
| Contact | `POST /contact` | public | — |
| Contact | `GET /contact` | yes | `contact:manage` |
| Contact | `PATCH /contact/:id/handle` | yes | `contact:manage` |
| Notifications | `GET /notifications` | yes | any authenticated |
| Notifications | `GET /notifications/unread-count` | yes | any authenticated |
| Notifications | `PATCH /notifications/read-all` | yes | any authenticated |
| Notifications | `PATCH /notifications/:id/read` | yes | any authenticated |
| Notifications | `POST /notifications` | yes | role `ADMIN`/`SUPER_ADMIN` |
| Audit Logs | `GET /audit-logs` | yes | role `ADMIN`/`SUPER_ADMIN` |
| Deleted Items | `GET /deleted-items` | yes | role `SUPER_ADMIN` |
| Deleted Items | `POST /deleted-items/:entityType/:id/restore` | yes | role `SUPER_ADMIN` |
| Deleted Items | `DELETE /deleted-items/:entityType/:id` | yes | role `SUPER_ADMIN` |
| Dashboard | `GET /dashboard/stats` | yes | role `ADMIN`/`SUPER_ADMIN` |
| Dashboard | `GET /dashboard/recent-activity` | yes | role `ADMIN`/`SUPER_ADMIN` |
