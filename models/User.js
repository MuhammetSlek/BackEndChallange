/**
 * models/User.js -- THE "M" OF MVC (first model)
 *
 * Describes the shape of a user document in MongoDB and holds the rules:
 *   firstName  -> required, max 10 characters   (Demo 2 rule)
 *   lastName   -> required, max 15 characters   (Demo 2 rule)
 *   email      -> required, unique, lowercase
 *   password   -> required, but stored as a bcrypt HASH, never plain text
 *   createdAt / updatedAt -> handled by { timestamps: true }
 *
 * The model is also where you would add a helper such as comparePassword()
 * so the controller never deals with bcrypt directly.
 */
