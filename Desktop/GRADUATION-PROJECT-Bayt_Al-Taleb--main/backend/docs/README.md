# API Docs

Machine-readable API documentation for the Bayt Al Taleb backend.

| File | What it is |
|---|---|
| [`openapi.yaml`](./openapi.yaml) | OpenAPI 3.0 spec — all endpoints, schemas, auth, errors |
| [`bayt-al-taleb.postman_collection.json`](./bayt-al-taleb.postman_collection.json) | Postman collection (58 requests, 15 folders) |
| [`API.md`](./API.md) | Human-readable reference |
| `gen-postman.mjs` | Generator for the Postman collection (re-run after API changes) |

## OpenAPI / Swagger

**View it (no install):**
- Paste `openapi.yaml` into <https://editor.swagger.io>, or
- VS Code → install the *OpenAPI (Swagger) Editor* / *Redoc* extension and open the file.

**Render Redoc to static HTML:**
```bash
npx @redocly/cli build-docs docs/openapi.yaml -o docs/api.html
```

**Validate after changes:**
```bash
npx @redocly/cli lint docs/openapi.yaml
```

**Serve Swagger UI from the app (optional — adds a dependency):**
```bash
npm i swagger-ui-express yamljs
```
then in `src/app.ts`:
```ts
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
const openapi = YAML.load(new URL('../docs/openapi.yaml', import.meta.url).pathname);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi)); // → http://localhost:4000/docs
```
> Not wired by default to keep runtime dependencies minimal; the static spec is the source of truth.

## Postman

1. **Import** `bayt-al-taleb.postman_collection.json` into Postman.
2. The collection ships with variables; `baseUrl` defaults to `http://localhost:4000/api/v1`.
3. Run **Auth → Login** (or **Register**) first — a test script auto-saves `{{accessToken}}` and `{{refreshToken}}` to collection variables. Every authenticated request inherits `Bearer {{accessToken}}` automatically.
4. Set ID variables (`{{majorId}}`, `{{fileId}}`, …) as you create resources.
5. For **Files → Upload**, select a file for the `file` form field (PDF/DOC/DOCX/PPT/PPTX/ZIP).

To regenerate the collection after route changes: `node docs/gen-postman.mjs`.
