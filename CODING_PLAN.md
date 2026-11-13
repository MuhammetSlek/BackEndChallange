# CODING PLAN

Status: **environment verified, no application logic written yet.**
The official brief has not been released. This plan is deliberately written so the same
skeleton absorbs a listings challenge, an auth challenge (or both), with only the
"Brief Mapping Worksheet" filled in on the day.

---

## 1. What is already verified

Every item below was actually executed against this machine, not assumed.

| Check | Result |
|---|---|
| Node / npm | v24.22.1 / 11.19.1 |
| Dependencies install cleanly | 100 packages, 0 vulnerabilities |
| MongoDB Atlas connection (auth + IP allow-list + TLS) | PASS |
| Database name resolves to `backend_challenge` | PASS |
| Collections `users`, `articles` exist | PASS |
| Write permission (insert, read back, drop) | PASS |
| EJS renders and escapes HTML | PASS |
| Express 5 serves a view and parses form bodies | PASS |
| Catch-all 404 without crashing | PASS |
| bcryptjs hash + compare (correct/wrong password) | PASS |
| Mongoose min/max length boundaries (25 fails, 26 passes; 10 passes, 11 fails) | PASS |
| Whitespace-only input rejected after trim | PASS |
| express-session + connect-mongo write / read / destroy | PASS |

Re-run any time with:

```bash
npm run db:test       # database only
npm run stack:test    # full runtime stack
```

---

## 2. Design principles

1. **Rules live in one place.** Every form goes through one validator driven by a rules
   object, so a changed character limit is a one-line edit, not a hunt through 6 files.
2. **Thin routes, fat controllers, dumb views.** Routes only map URL -> function. Views
   only display. Controllers decide.
3. **Two layers of validation.** Controller validation produces readable messages and
   re-renders the form; the Mongoose schema is the last line of defence.
4. **Preserve input on failure.** Always re-render with `values` so the user (and the
   grader) sees their text plus the errors. This is explicitly graded.
5. **Redirect after every successful write.** No rendering straight out of a POST.
6. **Nothing is hardcoded that the brief might change**: model name, field names,
   limits, and whether login is required are all data, not logic.

---

## 3. Target architecture

```
app.js                    entry: config -> connect -> session -> routes -> listen
config/db.js              connectDB()
models/User.js            user schema + password hashing hooks
models/Article.js         listing schema (+ optional author ref)
controllers/authController.js      register, login, welcome, logout
controllers/articleController.js   index, newForm, create, show, editForm, update, destroy
routes/authRoutes.js      URL -> auth controller
routes/articleRoutes.js   URL -> article controller
middleware/auth.js        isLoggedIn guard, exposeUser
middleware/validate.js    validate(input, rules) -> { values, errors }
views/                    5 page templates + partials
public/                   static css/images
scripts/                  verification tools (already built)
dump/                     submission database export
```

A request flows: **URL -> route -> controller -> model -> controller -> view -> HTML.**

---

## 4. Build phases

Each phase ends with a check you can actually run. Do not start the next phase until the
check passes; a broken phase 2 makes phase 5 impossible to debug.

### Phase 0 -- Brief intake (first 10 minutes)

1. Read the brief twice, once for the pages, once for the rules.
2. Fill in section 6 (Brief Mapping Worksheet) **before writing code.**
3. Write down every URL visible in the wireframe, exactly as printed.
4. Note the direction of every length rule (`longer than` = min, `not longer than` = max).
   Getting this backwards is the single most common lost point.

**Check:** the worksheet is filled and no cell says "?".

### Phase 1 -- Server skeleton (25 min)

`app.js`, in this order: dotenv (quiet) -> express() -> view engine + views dir ->
`express.urlencoded` -> `express.static` -> session -> routes -> 404 -> error handler ->
`connectDB()` -> `listen`.

Add a temporary `GET /health` returning `{ ok: true }`.

**Check:** `npm run dev` prints the database host, and `http://localhost:3000/health`
returns JSON. Delete `/health` at the end.

### Phase 2 -- Models + validator (40 min)

- Build `User` and `Article` schemas with the limits from the worksheet.
- Build `middleware/validate.js` with the rules engine (see section 5).
- Prove it with `npm run stack:test` plus 2-3 boundary cases of your own.

**Check:** a 25-character title is rejected, 26 is accepted, from the validator *and*
from the schema.

### Phase 3 -- Authentication (60 min)

Register -> login -> protected page -> logout, with bcrypt and a Mongo-backed session.

- Duplicate email must fail with a readable message.
- Wrong password must fail; the message must not reveal which half was wrong.
- `/welcome` (or whatever the brief names it) must redirect to `/` when not logged in.

**Check:** register a user, log in, refresh the protected page, log out, and confirm the
protected page now redirects. Confirm in Compass that the stored password is a `$2...` hash.

### Phase 4 -- CRUD read path (30 min)

`index` (sorted newest first, body truncated) and `show` (full document).

**Check:** the seeded documents appear, clicking a title opens the detail page.

### Phase 5 -- CRUD write path (45 min)

`newForm`, `create`, `editForm`, `update`. Validation failure must re-render the same
template with `values` and `errors`; success must redirect.

**Check:** empty form -> errors, nothing saved. Too-short -> errors, values preserved.
Valid -> redirect, new row visible, document visible in Compass.

### Phase 6 -- Delete, ownership, error handling (25 min)

Delete via `POST`; optional `author` check so a user can only edit/delete their own rows;
`mongoose.isValidObjectId` guard; 404 for missing or invalid ids; 4-argument error handler.

**Check:** `/articles/abc` returns 404, not a stack trace. Deleting removes it from the
list and from Compass.

### Phase 7 -- Test pass (30 min)

Run the full matrix in section 8. Fix, do not skip.

### Phase 8 -- Packaging (30 min)

Dump the database, take Compass screenshots, write the README, zip without `node_modules`,
push, record the video. See section 9.

---

## 5. Validation engine

One function powers every form:

```js
// middleware/validate.js
function validate(input, rules) {
  const values = {};
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const raw = input?.[field];
    const value = typeof raw === 'string' ? raw.trim() : '';
    values[field] = value;

    if (rule.required && value === '') {
      errors.push(`${rule.label} is required`);
      continue;
    }
    if (value === '') continue;                       // optional + empty = fine
    if (rule.min && value.length < rule.min)
      errors.push(`${rule.label} must be at least ${rule.min} characters`);
    if (rule.max && value.length > rule.max)
      errors.push(`${rule.label} must be no more than ${rule.max} characters`);
    if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      errors.push(`${rule.label} must be a valid email address`);
  }

  return { values, errors };
}
```

Rule sets (adjust the numbers from the worksheet only):

```js
const articleRules = {
  title: { label: 'Title',   required: true, min: 26 },    // "longer than 25"
  body:  { label: 'Article', required: true, min: 101 },   // "longer than 100"
};

const registerRules = {
  firstName: { label: 'First Name',    required: true, max: 10 },   // "not longer than 10"
  lastName:  { label: 'Last Name',     required: true, max: 15 },   // "not longer than 15"
  email:     { label: 'Email Address', required: true, type: 'email' },
  password:  { label: 'Password',      required: true, min: 6 },
};
```

Cross-field rules (password === confirmPassword) are checked after the loop, because they
compare two fields rather than one.

**Translation table -- do not confuse these:**

| Brief wording | Code | Rejects | Accepts |
|---|---|---|---|
| "longer than 25 characters" | `min: 26` | 25 and below | 26 and above |
| "not longer than 10 characters" | `max: 10` | 11 and above | 10 and below |
| "required" | `required: true` | empty and whitespace-only | any non-empty text |

---

## 6. Brief Mapping Worksheet (filled in from the official brief)

| Question | Answer |
|---|---|
| What is one item called? | **Tweet** (schema must be named `Tweet`, model file `TweetSchema.js`) |
| Item fields + rules | `title`: required, longer than 20 (min 21). `tweet`: required, no longer than 50 (max 50). Date shown on list and detail, from `createdAt`. |
| Second entity needed? | Yes — `User`, because there is a login/registration page and anonymous users are blocked |
| Auth required? | Yes: register (first name, last name, email, password, confirm password), login (email, password) |
| Is a user allowed to edit other users' items? | Not stated → not restricted. `author` is stored but not enforced |
| Exact URLs shown in the wireframe | `/` (login + register), `/tweet` (list), `/addTweet` (add), `/tweet/:id` (one tweet), `/tweet/edit/:id` (edit) |
| Which page shows what | List: title, body, date, "See More", count ("There are N tweets"). Detail: title, date, body, Delete, Edit Post. Add/Edit: Title + Tweet fields, Submit. |
| Sort order on the list page | Newest first |
| Delete = link or button? | A Delete control on the detail page; implemented as `POST /tweet/:id/delete`, then redirect to `/tweet` |
| Submission email + deadline + subject template | `challenge@matrixmaster.info`, before 18:00 (6 hours), `[YOUR NAME HERE] Tweeter MVC` |

Result of the mapping, relative to this skeleton:

- `models/Article.js` → **`models/TweetSchema.js`**, model name `Tweet`
- `controllers/articleController.js` → `controllers/tweetController.js`
- `routes/articleRoutes.js` → `routes/tweetRoutes.js`
- `views/articles/*` → `views/tweets/*`
- Rule numbers: `title min 21`, `tweet max 50`
- Everything else (auth, validator, sessions, 404s, packaging) unchanged.


---

## 7. Route map (current default)

| Method | URL | Handler | Guard |
|---|---|---|---|
| GET | `/` | auth: login + register page | -- |
| POST | `/register` | register | -- |
| POST | `/login` | login | -- |
| GET | `/welcome` | welcome page | yes |
| POST | `/logout` | logout | -- |
| GET | `/articles` | index | -- |
| GET | `/articles/new` | newForm | yes |
| POST | `/articles` | create | yes |
| GET | `/articles/:id` | show | -- |
| GET | `/articles/:id/edit` | editForm | yes |
| POST | `/articles/:id/edit` | update | yes |
| POST | `/articles/:id/delete` | destroy | yes |
| any | anything else | 404 view | -- |

The wireframe's URLs win over these defaults. If it says `/article/:id`, the route is
`/article/:id` -- not `/articles/:id`.

---

## 8. Test matrix

Test each row in the browser **and** once with curl/Postman so status codes are visible.

| Scenario | Expected |
|---|---|
| `GET /` with an empty collection | 200, empty-state message, no crash |
| Create with every field empty | 200/400, all required errors, 0 documents in Compass |
| Title of exactly 25 chars | rejected |
| Title of exactly 26 chars | accepted |
| Body of exactly 100 chars | rejected |
| Body of exactly 101 chars | accepted |
| Name field at its max, and at max+1 | accepted / rejected |
| Whitespace-only field | rejected |
| `GET /articles/:id` (valid) | 200, full text |
| `GET /articles/:id` (valid but deleted) | 404 |
| `GET /articles/abc` (invalid ObjectId) | 404, no stack trace |
| `GET /unknown-url` | 404 page |
| Update with invalid data | errors, old values preserved, document unchanged |
| Update with valid data | redirect, change visible, `updatedAt` moved |
| Delete | removed from list and from Compass |
| Protected URL while logged out | redirect to login page |
| Register duplicate email | readable error, no second user |
| Login wrong password | readable error, no session |
| Logout then protected URL | redirect |

Safety checks worth two minutes:

- Type `<script>alert(1)</script>` into a field: it must render as text, not execute
  (`<%= %>`, never `<%- %>`).
- Stop the internet, submit a form: an error page appears instead of a hang.

---

## 9. Packaging checklist

- [ ] `mongodump --uri="..." --db=backend_challenge --out=./dump` (brief demands DB files)
- [ ] Compass screenshots: Schema tab of each collection, with real documents inserted
- [ ] README: install, `.env`, run, routes, rules
- [ ] `.env.example` committed, `.env` excluded
- [ ] Any images under `public/images/` included
- [ ] Zip excludes `node_modules`
- [ ] Pushed to GitHub, repo public
- [ ] Video: list -> detail -> create (brief asks exactly these); add validation failure
      and edit if time allows
- [ ] Email: correct address, subject template, YouTube link within the hour
- [ ] Confirm which of the two conflicting emails/deadlines applies before sending

---

## 10. Time budget (5-hour challenge)

| Phase | Minutes |
|---|---|
| 0 Brief intake | 10 |
| 1 Server skeleton | 25 |
| 2 Models + validator | 40 |
| 3 Auth | 60 |
| 4 Read path | 30 |
| 5 Write path | 45 |
| 6 Delete + errors | 25 |
| 7 Test matrix | 30 |
| 8 Packaging + recording | 40 |
| Buffer | 15 |

If time runs short, the order of sacrifice is: styling -> delete -> ownership checks ->
auth. **Never** sacrifice validation, 404s, or the packaging.

---

## 11. Version gotchas (found by testing, not by guessing)

These are specific to the installed versions and will contradict most tutorials.

| Gotcha | Correct approach |
|---|---|
| `connect-mongo` v6 is not the class | `const { MongoStore } = require('connect-mongo')` |
| Session store removal | `store.destroy(sid)`, not `store.delete(sid)` |
| Express 5 removed `app.get('*')` | Use `app.use((req, res) => res.status(404)...)` |
| `dotenv` v18 prints a banner | `require('dotenv').config({ quiet: true })` |
| Mongoose 9 `minlength` counts characters after `trim` | Trim first, then count; whitespace-only fails `required` |
| Express 5 auto-forwards async errors | Still wrap DB calls and handle `CastError` for invalid ObjectIds |
| Atlas free tier pauses when idle | Resume in the console; cold start takes 10-30 s |
| Database names are case-sensitive | `backend_challenge` != `BackendChallenge` |
| A URI with `//` after the host | Driver parses the DB name as `/backend_challenge` and fails |

---

## 12. Commands

```bash
npm install
copy .env.example .env      # then fill MONGODB_URI
npm run dev                 # nodemon
npm start                   # plain node
npm run db:test             # database checks
npm run stack:test          # full runtime checks

mongodump --uri="$MONGODB_URI" --db=backend_challenge --out=./dump

git add -A
git commit -m "message"
git push
```

---

## 13. Definition of done

The challenge is done when all of these are true:

1. Every URL in the wireframe exists and does what the wireframe shows.
2. Every stated rule is enforced, including the exact boundary values.
3. Invalid input never reaches the database and always produces a visible message.
4. No URL can produce a stack trace.
5. Passwords are hashed; protected pages are protected.
6. The database dump, screenshots, README, zip and video are submitted.
