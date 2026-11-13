# BackEndChallange

Node.js MVC application (Express + Mongoose + EJS) built for the MatrixMaster backend challenge.
The skeleton is in place; the logic is written during the challenge.

## Stack

| Layer | Tool |
|---|---|
| Server | Express 5 |
| Database | MongoDB Atlas + Mongoose 9 |
| Views | EJS (server-rendered HTML) |
| Sessions | express-session + connect-mongo |
| Passwords | bcryptjs (hashed, never stored in plain text) |
| Config | dotenv |

## Getting started

```bash
npm install                # install dependencies
copy .env.example .env     # then fill in MONGODB_URI and SESSION_SECRET
npm run dev                # start with nodemon (auto-restart on save)
npm start                  # start normally
```

The app will not run until `app.js` is implemented - that is expected at this stage.

### .env

```
PORT=3000
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.xxxxx.mongodb.net/backend_challenge?retryWrites=true&w=majority
SESSION_SECRET=<long random string>
```

`.env` is git-ignored. `.env.example` is the committed template.
Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

If the password contains `@ : / ? # % &`, it must be URL-encoded in the URI (`@` -> `%40`).

## Folder structure

| Path | Role |
|---|---|
| `app.js` | Entry point: loads .env, connects the DB, configures Express, mounts routes, listens |
| `config/db.js` | Mongoose connection helper |
| `models/User.js` | User schema: firstName (max 10), lastName (max 15), unique email, hashed password |
| `models/Article.js` | Article schema: title (min 26), body (min 101), author reference |
| `controllers/authController.js` | Register, login, welcome, logout |
| `controllers/articleController.js` | List, show, create, edit, update, delete |
| `routes/authRoutes.js` | Auth URLs -> auth controller |
| `routes/articleRoutes.js` | Article URLs -> article controller |
| `middleware/auth.js` | `isLoggedIn` guard + `exposeUser` for views |
| `middleware/validate.js` | One rules-driven validator shared by every form |
| `views/` | EJS templates (`partials/` = shared pieces) |
| `public/` | Static files: CSS and images |
| `dump/` | Database export included with the submission |

## Planned routes

| Method | URL | Action |
|---|---|---|
| GET | `/` | Login + Register page |
| POST | `/register` | Create account |
| POST | `/login` | Start session |
| GET | `/welcome` | User info (protected) |
| POST | `/logout` | Destroy session |
| GET | `/articles` | List articles |
| GET | `/articles/new` | New article form (protected) |
| POST | `/articles` | Create article (protected) |
| GET | `/articles/:id` | Article detail |
| GET | `/articles/:id/edit` | Edit form (protected) |
| POST | `/articles/:id/edit` | Update article (protected) |
| POST | `/articles/:id/delete` | Delete article (protected) |

## Validation rules

- Every field is required.
- Article `title` must be **longer than 25** characters (26 or more).
- Article `body` must be **longer than 100** characters (101 or more).
- User `firstName` must be **at most 10** characters.
- User `lastName` must be **at most 15** characters.

Boundary values are strict: 25 fails but 26 passes; 100 fails but 101 passes.

## Database export (submission)

```bash
mongodump --uri="mongodb+srv://USER:PASSWORD@CLUSTER.xxxxx.mongodb.net/backend_challenge" --out=./dump
```

Or in Compass: select the database -> Export Database.
