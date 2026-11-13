# Tweeter — Node.js MVC

Backend challenge submission: a small Twitter-style app built with **Express 5 + Mongoose 9 + EJS**,
implementing the official wireframe with authentication, full CRUD and server-side validation.

## Brief compliance

| Requirement | Where it is implemented |
|---|---|
| Schema named `Tweet` | `models/TweetSchema.js` → `mongoose.model('Tweet', ...)` |
| Model file named `TweetSchema` | `models/TweetSchema.js` |
| Title longer than 20 characters | `minlength: 21` in the schema + `min: 21` in `middleware/validate.js` |
| Tweet no longer than 50 characters | `maxlength: 50` in the schema + `max: 50` in `middleware/validate.js` |
| Fields required, none empty | `required: true` + inputs trimmed, so whitespace-only counts as empty |
| Validate inserting **and** updating | Both `POST /addTweet` and `POST /tweet/edit/:id` run the same rules |
| MongoDB design (Workbench/Compass) | Database `backend_challenge`, collections `users` + `tweets` |
| Anonymous users blocked | `isLoggedIn` guards every route under `/tweet` and `/addTweet` |
| Custom routes match the wireframe | `/`, `/tweet`, `/addTweet`, `/tweet/:id`, `/tweet/edit/:id` |
| Node.js MVC | `models/` + `views/` + `controllers/` + `routes/` |
| Database files submitted | `dump/*.json` (exported with `npm run export:db`) |

## Stack

| Layer | Tool |
|---|---|
| Server | Express 5 |
| Database | MongoDB Atlas + Mongoose 9 |
| Views | EJS |
| Sessions | express-session + connect-mongo (sessions stored in MongoDB) |
| Passwords | bcryptjs, hashed in a model pre-save hook |
| Config | dotenv |

## Setup

```bash
npm install
copy .env.example .env      # then fill in MONGODB_URI and SESSION_SECRET
npm run seed                # optional: creates demo user + 4 tweets
npm run dev                 # http://localhost:3000
```

### Demo account (created by `npm run seed`)

```
email:    demo@tweeter.com
password: password123
```

### .env

```
PORT=3000
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/backend_challenge?retryWrites=true&w=majority
SESSION_SECRET=<long random string>
```

## Routes

| Method | URL | Page / action | Login required |
|---|---|---|---|
| GET | `/` | Login and Registration | no |
| POST | `/register` | Create account | no |
| POST | `/login` | Start session → `/tweet` | no |
| GET | `/logout` | End session → `/` | no |
| GET | `/tweet` | Tweet list, newest first | **yes** |
| GET | `/addTweet` | Add Tweet form | **yes** |
| POST | `/addTweet` | Create tweet → `/tweet` | **yes** |
| GET | `/tweet/:id` | One tweet (Delete + Edit Post) | **yes** |
| GET | `/tweet/edit/:id` | Edit form, pre-filled | **yes** |
| POST | `/tweet/edit/:id` | Update → `/tweet/:id` | **yes** |
| POST | `/tweet/:id/delete` | Delete → `/tweet` | **yes** |
| any | anything else | 404 page | — |

Anonymous visitors hitting a protected URL are redirected to `/?login=required`, which shows
"You must be logged in to view tweets."

## Validation rules

| Field | Rule | Rejected | Accepted |
|---|---|---|---|
| Title | required, longer than 20 | 20 characters | 21 characters |
| Tweet | required, no longer than 50 | 51 characters | 50 characters |
| First Name | required | empty / whitespace | any text |
| Last Name | required | empty / whitespace | any text |
| Email Address | required, valid, unique | malformed / duplicate | valid address |
| Password | required | empty | any text |
| Confirm Password | required, must match | mismatch | same as password |

On any failure the same form is rendered again with **HTTP 400**, the error messages, and the
values the user typed (passwords are never echoed back). Nothing is written to the database.

## Project structure

```
app.js                      entry point: env, express, sessions, routes, 404, listen
config/db.js                Mongoose connection
models/TweetSchema.js       Tweet schema (named Tweet) + rules
models/User.js              User schema + bcrypt hashing
controllers/authController.js    register / login / logout
controllers/tweetController.js   list / show / create / edit / update / delete
routes/authRoutes.js        /, /register, /login, /logout
routes/tweetRoutes.js       /tweet, /addTweet, /tweet/edit/:id, /tweet/:id/delete
middleware/auth.js          isLoggedIn, exposeUser, findTweetOr404
middleware/validate.js      one rules-driven validator + the rule sets
views/                      EJS templates (partials/ = shared pieces)
public/css/style.css        minimal styling (not graded)
public/images/              images
dump/                       database export for submission
scripts/                    verification, seed and export tools
```

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Run the server |
| `npm run dev` | Run with nodemon (auto-restart) |
| `npm run seed` | Create demo user + 4 example tweets (idempotent) |
| `npm run test:http` | 65 end-to-end checks over real HTTP (register, login, CRUD, validation, 404s) |
| `npm run db:test` | Connection, database name, collections, read + write permissions |
| `npm run stack:test` | EJS, Express 5, form bodies, bcrypt, Mongoose limits, sessions |
| `npm run export:db` | Write every collection to `dump/*.json` |

All test scripts create their own data and clean up afterwards.

## Database and submission files

- Database: `backend_challenge`
- Collections: `users`, `tweets`, `sessions`
- `npm run export:db` writes `dump/users.json`, `dump/tweets.json`, `dump/sessions.json`
  and `dump/manifest.json`. These are committed to the repository.
- Compass screenshots: open each collection, use the **Schema** tab so the field types are
  visible, then also show a few documents.

## Presentation checklist

1. `/` — show the Login and Registration page.
2. Log in with the demo account.
3. `/tweet` — list with count and dates.
4. Click **See More** — one tweet with Delete and Edit Post.
5. **Edit Post** — change the title, submit, land back on the tweet.
6. **Add Tweet** — submit an invalid tweet first (title of 20 characters) to show validation,
   then a valid one and confirm it appears at the top of the list.
7. Optionally delete a tweet and show the redirect back to `/tweet`.

## Version notes

These versions are newer than most tutorials, and the differences matter:

- `connect-mongo` v6 exports named symbols: `const { MongoStore } = require('connect-mongo')`.
  Its removal method is `store.destroy(sid)`, not `store.delete(sid)`.
- Express 5 removed `app.get('*')`; the 404 handler uses a bare `app.use(...)`.
- Mongoose runs `trim` before `minlength`/`maxlength`, which is why whitespace-only input
  fails `required` rather than passing a length check.
- Atlas free clusters pause when idle; the first request after a pause can take 10–30 seconds.
