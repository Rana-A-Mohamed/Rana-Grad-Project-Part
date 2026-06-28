// Generates the Postman collection for the Bayt Al Taleb API.
// Run: node docs/gen-postman.mjs  (writes docs/bayt-al-taleb.postman_collection.json)
import { writeFileSync } from 'node:fs';

const RAW = '{{baseUrl}}';

/** Build a request item. method, path segments (array), opts. */
function req(name, method, segs, opts = {}) {
  const url = {
    raw: `${RAW}/${segs.join('/')}${opts.query ? '?' + opts.query.map((q) => `${q.key}=${q.value ?? ''}`).join('&') : ''}`,
    host: [RAW],
    path: segs,
  };
  if (opts.query) url.query = opts.query.map((q) => ({ key: q.key, value: q.value ?? '', disabled: q.disabled ?? true }));
  const request = { method, header: [], url };
  if (opts.auth === false) request.auth = { type: 'noauth' };
  if (opts.body) {
    request.header.push({ key: 'Content-Type', value: 'application/json' });
    request.body = { mode: 'raw', raw: JSON.stringify(opts.body, null, 2), options: { raw: { language: 'json' } } };
  }
  if (opts.formdata) {
    request.body = { mode: 'formdata', formdata: opts.formdata };
  }
  if (opts.description) request.description = opts.description;
  const item = { name, request, response: [] };
  if (opts.event) item.event = opts.event;
  return item;
}

// Auto-capture tokens from /auth login & register responses.
const captureTokens = {
  listen: 'test',
  script: {
    type: 'text/javascript',
    exec: [
      'const json = pm.response.json();',
      'if (json && json.data && json.data.tokens) {',
      "  pm.collectionVariables.set('accessToken', json.data.tokens.accessToken);",
      "  pm.collectionVariables.set('refreshToken', json.data.tokens.refreshToken);",
      "  console.log('Saved access & refresh tokens to collection variables.');",
      '}',
    ],
  },
};

const collection = {
  info: {
    name: 'Bayt Al Taleb API',
    description:
      'REST API for the Bayt Al Taleb platform. Set {{baseUrl}} (default http://localhost:4000/api/v1). ' +
      'Run Auth > Login first — it auto-saves {{accessToken}} & {{refreshToken}}. ' +
      'All authenticated requests inherit Bearer {{accessToken}} from the collection.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:4000/api/v1' },
    { key: 'accessToken', value: '' },
    { key: 'refreshToken', value: '' },
    { key: 'userId', value: '' },
    { key: 'majorId', value: '' },
    { key: 'collegeId', value: '' },
    { key: 'scholarshipId', value: '' },
    { key: 'fileId', value: '' },
    { key: 'sectionId', value: '' },
    { key: 'faqId', value: '' },
    { key: 'notificationId', value: '' },
  ],
  item: [
    {
      name: 'Auth',
      item: [
        req('Register', 'POST', ['auth', 'register'], {
          auth: false,
          event: [captureTokens],
          body: { email: 'sara@example.com', password: 'password123', fullName: 'Sara A.' },
        }),
        req('Login', 'POST', ['auth', 'login'], {
          auth: false,
          event: [captureTokens],
          body: { email: 'sara@example.com', password: 'password123' },
        }),
        req('Refresh', 'POST', ['auth', 'refresh'], {
          auth: false,
          event: [captureTokens],
          body: { refreshToken: '{{refreshToken}}' },
        }),
        req('Logout', 'POST', ['auth', 'logout'], { auth: false, body: { refreshToken: '{{refreshToken}}' } }),
      ],
    },
    {
      name: 'Users',
      item: [
        req('List users', 'GET', ['users'], { query: [{ key: 'page', value: '1' }, { key: 'pageSize', value: '20' }] }),
        req('Get user', 'GET', ['users', '{{userId}}']),
        req('Create user', 'POST', ['users'], {
          body: { email: 'new@example.com', password: 'password123', fullName: 'New User', role: 'MEMBER' },
        }),
        req('Update user', 'PATCH', ['users', '{{userId}}'], { body: { fullName: 'Updated Name', isActive: true } }),
      ],
    },
    {
      name: 'Roles',
      item: [
        req('List roles', 'GET', ['roles']),
        req('Assign role to user', 'PUT', ['roles', '{{userId}}', 'assign'], { body: { role: 'MODERATOR' } }),
      ],
    },
    {
      name: 'Colleges',
      item: [
        req('List colleges (public)', 'GET', ['colleges'], { auth: false, query: [{ key: 'page', value: '1' }] }),
        req('Get college (public)', 'GET', ['colleges', '{{collegeId}}'], { auth: false }),
        req('List college majors (public)', 'GET', ['colleges', '{{collegeId}}', 'majors'], { auth: false }),
        req('Create college', 'POST', ['colleges'], {
          body: { slug: 'engineering', name: 'Engineering', description: 'Faculty of Engineering', isActive: true },
        }),
        req('Update college', 'PATCH', ['colleges', '{{collegeId}}'], { body: { name: 'Engineering & Tech' } }),
        req('Delete college', 'DELETE', ['colleges', '{{collegeId}}']),
      ],
    },
    {
      name: 'Majors',
      item: [
        req('List majors (public)', 'GET', ['majors'], { auth: false, query: [{ key: 'page', value: '1' }] }),
        req('Get major (public)', 'GET', ['majors', '{{majorId}}'], { auth: false }),
        req('Create major', 'POST', ['majors'], {
          body: { slug: 'nursing', name: 'Nursing', isActive: true, collegeId: '{{collegeId}}' },
        }),
        req('Update major', 'PATCH', ['majors', '{{majorId}}'], { body: { name: 'Nursing Sciences' } }),
        req('Soft delete major', 'DELETE', ['majors', '{{majorId}}'], { body: { reason: 'duplicate' } }),
      ],
    },
    {
      name: 'Scholarships',
      item: [
        req('List scholarships (public)', 'GET', ['scholarships'], { auth: false }),
        req('Get scholarship (public)', 'GET', ['scholarships', '{{scholarshipId}}'], { auth: false }),
        req('Create scholarship', 'POST', ['scholarships'], {
          body: { slug: 'ministry-grant', name: 'Ministry Grant', isActive: true },
        }),
        req('Update scholarship', 'PATCH', ['scholarships', '{{scholarshipId}}'], { body: { name: 'Ministry Grant 2026' } }),
        req('Soft delete scholarship', 'DELETE', ['scholarships', '{{scholarshipId}}'], { body: { reason: 'expired' } }),
      ],
    },
    {
      name: 'Content (Sections & FAQs)',
      description: 'entityType is MAJOR or SCHOLARSHIP; entityId is the owner id.',
      item: [
        req('List sections (public)', 'GET', ['content', 'MAJOR', '{{majorId}}', 'sections'], { auth: false }),
        req('Add section', 'POST', ['content', 'MAJOR', '{{majorId}}', 'sections'], {
          body: { title: 'Overview', content: 'About this major...', sortOrder: 0 },
        }),
        req('Update section', 'PATCH', ['content', 'MAJOR', '{{majorId}}', 'sections', '{{sectionId}}'], {
          body: { title: 'Updated Overview' },
        }),
        req('Delete section', 'DELETE', ['content', 'MAJOR', '{{majorId}}', 'sections', '{{sectionId}}']),
        req('List FAQs (public)', 'GET', ['content', 'MAJOR', '{{majorId}}', 'faqs'], { auth: false }),
        req('Add FAQ', 'POST', ['content', 'MAJOR', '{{majorId}}', 'faqs'], {
          body: { question: 'Is there a fee?', answer: 'No.', sortOrder: 0 },
        }),
        req('Update FAQ', 'PATCH', ['content', 'MAJOR', '{{majorId}}', 'faqs', '{{faqId}}'], { body: { answer: 'Free.' } }),
        req('Delete FAQ', 'DELETE', ['content', 'MAJOR', '{{majorId}}', 'faqs', '{{faqId}}']),
      ],
    },
    {
      name: 'Files',
      item: [
        req('List files', 'GET', ['files'], {
          query: [
            { key: 'status', value: 'PENDING' },
            { key: 'type', value: 'SUMMARY' },
            { key: 'mine', value: 'true' },
            { key: 'page', value: '1' },
          ],
        }),
        req('List files by owner', 'GET', ['files', 'owner', 'MAJOR', '{{majorId}}']),
        req('List approved files by owner', 'GET', ['files', 'owner', 'MAJOR', '{{majorId}}', 'approved']),
        req('Get file', 'GET', ['files', '{{fileId}}']),
        req('Download file (public if APPROVED)', 'GET', ['files', '{{fileId}}', 'download'], { auth: false }),
        req('Upload file (multipart)', 'POST', ['files'], {
          formdata: [
            { key: 'file', type: 'file', src: [] },
            { key: 'title', value: 'Anatomy Summary', type: 'text' },
            { key: 'description', value: 'Chapter 1-3', type: 'text' },
            { key: 'type', value: 'SUMMARY', type: 'text' },
            { key: 'ownerType', value: 'MAJOR', type: 'text' },
            { key: 'ownerId', value: '{{majorId}}', type: 'text' },
          ],
          description: 'Select a PDF/DOC/DOCX/PPT/PPTX/ZIP for the "file" field.',
        }),
        req('Soft delete file', 'DELETE', ['files', '{{fileId}}'], { body: { reason: 'spam' } }),
      ],
    },
    {
      name: 'Reviews',
      item: [
        req('Approve / reject file', 'POST', ['files', '{{fileId}}', 'reviews'], {
          body: { action: 'APPROVE', comment: 'Looks good' },
        }),
        req('Review history', 'GET', ['files', '{{fileId}}', 'reviews']),
      ],
    },
    {
      name: 'Search',
      item: [
        req('Search (public)', 'GET', ['search'], {
          auth: false,
          query: [
            { key: 'q', value: 'engineering', disabled: false },
            { key: 'type', value: 'major' },
            { key: 'types', value: 'major,scholarship' },
            { key: 'page', value: '1' },
            { key: 'pageSize', value: '20' },
          ],
        }),
      ],
    },
    {
      name: 'Contact',
      item: [
        req('Submit message (public)', 'POST', ['contact'], {
          auth: false,
          body: { name: 'Sara', email: 'sara@example.com', subject: 'Question', message: 'Hello, I have a question.' },
        }),
        req('List messages (admin)', 'GET', ['contact'], { query: [{ key: 'handled', value: 'false' }, { key: 'page', value: '1' }] }),
        req('Mark handled', 'PATCH', ['contact', '{{contactId}}', 'handle']),
      ],
    },
    {
      name: 'Notifications',
      item: [
        req('List my notifications', 'GET', ['notifications'], { query: [{ key: 'page', value: '1' }] }),
        req('Unread count', 'GET', ['notifications', 'unread-count']),
        req('Mark all read', 'PATCH', ['notifications', 'read-all']),
        req('Mark one read', 'PATCH', ['notifications', '{{notificationId}}', 'read']),
        req('Create announcement (admin)', 'POST', ['notifications'], {
          body: { title: 'Maintenance', message: 'Down tonight 12-1am', targetRole: 'MODERATOR' },
        }),
      ],
    },
    {
      name: 'Audit Logs',
      item: [
        req('List audit logs (admin)', 'GET', ['audit-logs'], {
          query: [
            { key: 'entityType', value: 'FILE' },
            { key: 'action', value: 'APPROVE' },
            { key: 'userId', value: '{{userId}}' },
            { key: 'page', value: '1' },
          ],
        }),
      ],
    },
    {
      name: 'Deleted Items',
      item: [
        req('Queue (super admin)', 'GET', ['deleted-items'], { query: [{ key: 'entityType', value: 'MAJOR' }] }),
        req('Restore item', 'POST', ['deleted-items', 'MAJOR', '{{majorId}}', 'restore']),
        req('Permanently delete', 'DELETE', ['deleted-items', 'MAJOR', '{{majorId}}'], { body: { reason: 'gdpr' } }),
      ],
    },
    {
      name: 'Dashboard',
      item: [
        req('Stats (admin)', 'GET', ['dashboard', 'stats']),
        req('Recent activity (admin)', 'GET', ['dashboard', 'recent-activity']),
      ],
    },
  ],
};

// `contactId` var referenced in Contact group — add it.
collection.variable.push({ key: 'contactId', value: '' });

writeFileSync(
  new URL('./bayt-al-taleb.postman_collection.json', import.meta.url),
  JSON.stringify(collection, null, 2) + '\n',
);
console.log('Wrote docs/bayt-al-taleb.postman_collection.json');
