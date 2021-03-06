const Repository = require("./repository")
const Session = require("../models/session")
const Errors = require("../errors")

const bcrypt = require("bcrypt")
const { nanoid } = require("nanoid")

/**
 * Repository for all methods relating to sessions
 */
class SessionRepository extends Repository {
    /**
     *
     * Get a listing of sessions, optionally filtered and sorted
     *
     * Authorized Cases:
     * - Caller is Admin
     * - Caller is requesting only their own sessions
     *
     * @param {string} token - An authentication token for verifying authorization
     *
     * @param {object} [options] An object with options
     *
     * @param {object} [options.filter] Describes how to filter the results
     * @param {string} options.filter.userId Filters result down to sessions belonging to a specific user
     *
     * @param {object} [options.sort] Describes how to sort the results
     * @param {SessionSortField} options.sort.field The field to sort by
     * @param {SortDirection} options.sort.direction The direction to sort in
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async getAll(token, options = {}) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        const { filter, sort } = options

        const result = await this.store.Session.findAll({
            ...(filter != null && {where: {
                ...(filter.userId != null && {UserId: filter.userId})
            }}),
            ...(sort != null && {order: [sort.field, sort.direction]})
        })
        return result == null ? [] : await Session.createFromArray(result, this.swolly, token, caller)
    })}

    /**
     *
     * Get a session by its id
     *
     * Authorized Cases:
     * - Any registered user
     *
     * @param {string} token - An authentication token for verifying authorization
     *
     * @param {object} id The id of the requested session
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async get(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const result = await this.store.Session.findByPk(id)
        return result == null ? null : await Session.create(result, this.swolly, token, caller)
    })}

    /**
     * @typedef {object} SessionRepositoryCreateResult
     * @property {User} user - The user who the session was created for
     * @property {Session} session - The newly created session
     * */

    /**
     *
     * Create a new session
     *
     * Authorized Cases:
     * - Any registered user (providing mail and password)
     *
     * @param {string} mail - Mail address of the user
     * @param {string} password - Password of the user
     *
     * @return {SessionRepositoryCreateResult} 
     *
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the mail & password combination, could not be authenticated.
     * @throws {SwollySequelizeError}
     */
    async create(mail, password) { return Repository._rethrow(async () => {
        const user = await this.swolly.User._getByMail(mail)

        if (user == null || !(await bcrypt.compare(password, user.getPassword()))) {
            throw new Errors.AuthorizationError("User is not known or password was incorrect.")
        }

        const session = await this.store.Session.create({
            token: nanoid(255),
            UserId: user.getId()
        })

        user.setCallerToken(session.token)
        await user.authenticate()

        return {
            user,
            session: await Session.create(session, this.swolly, session.token, user)
        }
    })}

    /**
     *
     * Delete a session
     *
     * Authorized Cases:
     * - Any registered user deleting their own session
     *
     * @param {string} token - An authentication token for verifying authorization
     * @param {string} id - The id of the session to be deleted
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the mail & password combination, could not be authenticated.
     * @throws {SwollySequelizeError}
     */
    async delete(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const session = await this.store.Session.findByPk(id)

        if (session.UserId != caller.getId()) {
            throw new Errors.AuthorizationError("Users may only delete their own sessions.")
        }

        await session.destroy()
    })}

    /**
     *
     * Delete a session by token
     *
     * Authorized Cases:
     * - Any registered user deleting their own session
     *
     * @param {string} token - An authentication token for verifying authorization
     * @param {string} sessionToken - The token of the session to be deleted
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the mail & password combination, could not be authenticated.
     * @throws {SwollySequelizeError}
     */
    async deleteByToken(token, sessionToken) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const session = await this.store.Session.findOne({
            where: { token: sessionToken }
        })

        if (session.UserId != caller.getId()) {
            throw new Errors.AuthorizationError("Users may only delete their own sessions.")
        }

        await session.destroy()
    })}
}

module.exports = SessionRepository
