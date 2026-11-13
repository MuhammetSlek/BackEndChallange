# Tweeter

A small Twitter style app made with Node.js, Express, MongoDB (Mongoose) and EJS for the
MatrixMaster backend challenge.

Users can register and log in. Once logged in they see all tweets, can open a tweet, add a
new one, edit it or delete it. Anonymous visitors are sent back to the login page.

## Run it

```
npm install
npm run dev
```

Create a `.env` file in the project root:

```
PORT=3000
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=any-long-random-string
```

Then open http://localhost:3000

## Pages

```
/                  login and registration
/tweet             all tweets (login required)
/addTweet          add a tweet (login required)
/tweet/:id         one tweet (login required)
/tweet/edit/:id    edit a tweet (login required)
```

## Rules

- Every field is required, empty spaces do not count.
- Title must be longer than 20 characters.
- Tweet must be no longer than 50 characters.
- The schema is called Tweet and lives in `models/TweetSchema.js`.

## Database

Database name: `backend_challenge`

Collections: `users`, `tweets`

The exported collections are in the `dump` folder.
