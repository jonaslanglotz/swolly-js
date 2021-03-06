const Errors = require("../errors")
const User = require("../models/user")
const { BaseError: SequelizeBaseError } = require('sequelize');

class Repository {
    /**
     * The constructor for this class.
     * 
     * @param {Swolly} swolly - The swolly instance this repository belongs to
     * */
    constructor(swolly) {
        /** @type {Sequelize} */
        this.swolly = swolly

        /** @type {Sequelize} */
        this.store = swolly.store
    }


    /**
     *
     * Get an associated user object from a session token
     *
     * @param {string} token - A authentication token for verifying authorization
     * 
     * @return {User}
     *
     * @throws {SwollyAuthorizationError} Thrown when the token is invalid
     * @throws {SwollySequelizeError}
     */
    async _getAuth(token) {
        return Repository._rethrow(async () => {
            if (typeof token !== "string") {
                throw new Errors.AuthorizationError("The provided token was not a string.")
            }

            const user = await this._userFromToken(token)

            if (user == null) {
                throw new Errors.AuthorizationError("The provided token was invalid.")
            }

            return user
        })
    }

    /**
     *
     * Rethrow sequelize errors as swolly errors
     *
     * @param {!function} fn - The function to execute
     * @return {*} The result of calling fn
     *
     * @throws {SwollySequelizeError}
     */
    static async _rethrow(fn) {
        try {
            return await fn()
        } catch(err) {
            if (err instanceof SequelizeBaseError) {
                throw new Errors.SequelizeError(err.message)
            }
            throw err
        }
    }

    /**
     *
     * Get an associated user object from a session token
     *
     * @param {!string} token - A authentication token for verifying authorization
     * 
     * @return {User} The user belonging to the token. Returns null if token is invalid.
     *
     * @throws {SwollySequelizeError}
     */
    async _userFromToken(token) {
        return Repository._rethrow(async () => {
            if (typeof token !== "string") {
                return null
            }

            const session = await this.store.Session.findOne({
                where: {
                    token
                },
                include: {
                    model: this.store.User,
                    as: "user"
                }
            })

            if (session == null || session.user == null) {
                return null
            }

            return new User(session.user, this.swolly)
        })
    }
}

module.exports = Repository
