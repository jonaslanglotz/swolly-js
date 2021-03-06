const Repository = require("./repository")
const User = require("../models/user")
const Session = require("../models/session")
const Errors = require("../errors")
const Enums = require("../enums")

const { Sequelize } = require("sequelize");
const { nanoid } = require("nanoid")
const bcrypt = require("bcrypt")

/**
 * Repository for all methods relating to users
 */
class UserRepository extends Repository {
    /**
     *
     * Get a listing of registered users, optionally filtered and sorted
     *
     * Authorized Cases:
     * - Caller is admin
     * - Registered user querying by supported Task
     *
     * @param {string} token - An authentication token for verifying authorization
     *
     * @param {object} [options] An object with options
     *
     * @param {object} [options.filter] Describes how to filter the results
     * @param {string} [options.filter.role] Filters result down to users with a specific role
     * @param {string} [options.filter.supportingTaskId] Filters result down to users supporting this task
     *
     * @param {object} [options.sort] Describes how to sort the results
     * @param {UserSortField} [options.sort.field] The field to sort by
     * @param {SortDirection} [options.sort.direction] The direction to sort in
     *
     * @return {User[]}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async getAll(token, options = {}) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        if(
            !caller.isAdmin
            && (options.filter == null || options.filter.supportingTaskId == null)
        ) { 
            throw new Errors.AuthorizationError()
        }

        const { filter, sort } = options

        const result = await this.store.User.findAll({
            ...(filter != null && {where: {
                ...(filter.role != null && {role: filter.role})
            }}),
            ...(sort != null && {order: [[sort.field, sort.direction]]}),
            ...(filter != null && filter.supportingTaskId != null && { include: {
                model: this.store.Task,
                as: "supportedTasks",
                where: {
                    id: filter.supportingTaskId
                }
            }}),
        })

        return result == null ? [] : await User.createFromArray(result, this.swolly, token, caller)
    })}

    /**
     *
     * Get a user object by its id
     *
     * Authorized Cases:
     * - Any registered user
     *
     * @param {string} token - A authentication token for verifying authorization
     * @param {string} id - A valid user id
     *
     * @return {User}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async get(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        const result = await this.store.User.findByPk(id)

        return result == null ? null : await User.create(result, this.swolly, token, caller)
    })}


    /**
     * Get an unauthenticated user object by its mail address
     *
     * ### INTERNAL ###
     *
     * @param {string} mail - A mail address associated with a user
     *
     * @return {User}
     *
     * @throws {SwollySequelizeError}
     */
    async _getByMail(mail) { return Repository._rethrow(async () => {
        const result = await this.store.User.findOne({
            where: { mail }
        })

        return result == null ? null : await new User(result, this.swolly)
    })}

    /**
     *
     * Create a new user
     *
     * Authorized Cases:
     * - An unauthenticated request creating a new initiator or supporter (register action)
     * - An admin creating a new user
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {object} user - The object containing the values of the user
     * @param {string} user.fullname - Name of the user
     * @param {string} user.mail - Mail address of the user
     * @param {UserGender} user.gender - Gender of the user
     * @param {UserRole} user.role - Role of the user
     * @param {string} user.password - Password of the user
     *
     * @return {object} An object containing a 'user' and a 'session' property
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the user is not correct in some way (see {@link UserValidationErrorCode} for codes)
     * @throws {SwollySequelizeError}
     */
    async create(token, user) { return Repository._rethrow(async () => {
        const caller = await this._userFromToken(token)

        if((caller == null || !caller.isAdmin) && user.role == Enums.UserRole.ADMIN) { 
            throw new Errors.AuthorizationError()
        }

        User.validate(user)

        const hash = await bcrypt.hash(user.password, 12)

        var userResult, sessionResult
        try {
            userResult = await this.store.User.create({
                fullname: user.fullname,
                mail: user.mail,
                gender: user.gender,
                role: user.role,
                password: hash
            })
        } catch (err) {
            if (err instanceof Sequelize.UniqueConstraintError) {
                throw new Errors.ValidationError(
                    "This mail address is already used",
                    Enums.UserValidationErrorCode.MAIL_ALREADY_USED
                )
            }
            throw err
        }

        sessionResult = await userResult.createSession({
            token: nanoid(255)
        })

        return {
            user: await User.create(userResult, this.swolly, sessionResult.token),
            session: await Session.create(sessionResult, this.swolly, sessionResult.token)
        }
    })}

    /**
     *
     * Update an existing user
     *
     * Authorized Cases:
     * - An admin updating a user
     * - A user updating themselves
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {string} id - The user to operate on
     *
     * @param {object} update - The object containing the values of the user
     * @param {string} [update.fullname] - New name of the user
     * @param {string} [update.mail] - New mail address of the user
     * @param {UserGender} [update.gender] - New gender of the user
     * @param {UserRole} [update.role] - New role of the user
     * @param {string} [update.password] - New password of the user
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the user is not correct in some way (see {@link UserValidationErrorCode} for codes)
     * @throws {SwollyNotFoundError} Thrown when the user could not be found
     * @throws {SwollySequelizeError}
     */
    async update(token, id, update) { return Repository._rethrow(async () => {
        if (update && Object.keys(update).length === 0) {
            return
        }

        const caller = await this._getAuth(token)

        if(
            !caller.isAdmin
            && (id !== caller.getId() || update.role === Enums.UserRole.ADMIN)
        ) { 
            throw new Errors.AuthorizationError()
        }

        const userInstance = await this.store.User.findByPk(id)
        if (userInstance == null) {
            throw new Error.NotFoundError("User could not be found.")
        }

        let newUserValues = { ...userInstance.dataValues, ...update }

        User.validate(newUserValues)
        
        if (update.password == null) {
            newUserValues.password = await bcrypt.hash(userValues.password, 12)
        }

        try {
            await this.store.User.update({
                fullname: newUserValues.fullname,
                mail: newUserValues.mail,
                gender: newUserValues.gender,
                role: newUserValues.role,
                password: newUserValues.password
            }, {
                where: {
                    id: id
                }
            })
        } catch (err) {
            if (err instanceof Sequelize.UniqueConstraintError) {
                throw new Errors.ValidationError(
                    "This mail address is already used",
                    Enums.UserValidationErrorCode.MAIL_ALREADY_USED
                )
            }
            throw err
        }
    })}

    /**
     *
     * Delete an existing user
     *
     * Authorized Cases:
     * - An admin deleting a user
     * - A user deleting themselves
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {string} id - The user to operate on
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyNotFoundError} Thrown when the user could not be found
     * @throws {SwollySequelizeError}
     */
    async delete(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        if(
            !caller.isAdmin
            && id !== caller.getId()
        ) { 
            throw new Errors.AuthorizationError()
        }

        const userInstance = await this.store.User.findByPk(id)
        if (userInstance == null) {
            throw new Error.NotFoundError("User could not be found.")
        }

        await userInstance.destroy()
    })}
}

module.exports = UserRepository

