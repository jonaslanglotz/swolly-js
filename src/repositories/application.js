const Repository = require("./repository")
const Application = require("../models/application")
const ApplicationValidationErrorCode = require("../enums/applicationValidationErrorCode")
const Errors = require("../errors")

/**
 * Repository for all methods relating to applications
 */
class ApplicationRepository extends Repository {
    /**
     *
     * Get a listing of applications, optionally filtered and sorted
     *
     * Authorized Cases:
     * - A user accessing their own applications
     * - A user accessing applications for a single task
     * - An admin accessing applications
     *
     * @param {string} token - An authentication token for verifying authorization
     *
     * @param {object} [options] An object with options
     *
     * @param {object} [options.filter] Describes how to filter the results
     * @param {string} [options.filter.taskId] Filters result down to applications to a single task
     * @param {string} [options.filter.userId] Filters result down to applications of a single user
     * @param {string} [options.filter.accepted] Filters result down to applications that have been accepted
     *
     * @param {object} [options.sort] Describes how to sort the results
     * @param {ApplicationSortField} [options.sort.field] The field to sort by
     * @param {SortDirection} [options.sort.direction] The direction to sort in
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     *
     * @return {Application[]}
     */
    async getAll(token, options = {}) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        let { filter, sort } = options

        if (
            !caller.isAdmin
            && (filter && filter.userId != caller.getId())
            && (filter && filter.taskId == null)
        ) {
            throw new Errors.AuthorizationError()
        }

        const result = await this.store.Application.findAll({
            ...(filter != null && {where: {
                ...(filter.taskId != null && {TaskId: filter.taskId}),
                ...(filter.userId != null && {UserId: filter.userId}),
                ...(filter.accepted != null && {accepted: filter.accepted}),
            }}),
            ...(sort != null && {order: [[sort.field, sort.direction]]})
        })

        return result == null ? [] : await Application.createFromArray(result, this.swolly, token, caller)
    })}

    /**
     *
     * Get an application object by its id
     *
     * @param {string} token - A authentication token for verifying authorization
     * @param {string} id - A valid application id
     *
     * @return {Application}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async get(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const result = await this.store.Application.findByPk(id)
        return result == null ? null : await Application.create(result, this.swolly, token, caller)
    })}


    /**
     *
     * Create a new application
     *
     * Authorized Cases:
     * - Any registered user applying for a task
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {object} values - The object containing the values of the application
     * @param {string} values.text - Text of the application
     * @param {string} values.TaskId - The task which to apply to
     *
     * @return {Application}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the application is not correct in some way (see {@link ApplicationValidationErrorCode} for codes)
     * @throws {SwollySequelizeError}
     */
    async create(token, values) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        values.accepted = true

        Application.validate(values)

        if (await this.store.Application.findOne({ where: {
            TaskId: values.taskId,
            UserId: caller.getId()
        }}) != null) {
            throw new Errors.ValidationError(
                "User has already applied to this task.",
                ApplicationValidationErrorCode.ALREADY_APPLIED
            )
        }

        const task = await this.store.Task.findByPk(values.taskId)

        if (task == null) {
            throw new Errors.NotFoundError("Task not found.")
        }

        const application = await task.createApplication({
            text: values.text,
            UserId: caller.getId(),
            accepted: values.accepted
        })

        return await Application.create(application, this.swolly, token)
    })}

    /**
     *
     * Update an existing task
     *
     * Authorized Cases:
     * - An admin updating a task
     * - A project creator updating a task they made
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {string} id - The application to operate on
     *
     * @param {object} update - The object containing the values of the application
     * @param {string} [update.accepted] - Acceptance status of the application
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the application is not correct in some way (see {@link ApplicationValidationErrorCode} for codes)
     * @throws {SwollyNotFoundError} Thrown when the application could not be found
     * @throws {SwollySequelizeError}
     */
    async update(token, id, update) { return Repository._rethrow(async () => {
        if (update && Object.keys(update).length === 0) {
            return
        }

        const caller = await this._getAuth(token)

        const application = await this.store.Application.findByPk(id, {
            include: {
                model: this.store.Task,
                as: "task",
                include: {
                    model: this.store.Project,
                    as: "project"
                }
            }
        })
        if (application == null) {
            throw new Error.NotFoundError("Application could not be found.")
        }


        if(
            !caller.isAdmin
            || application.task.project.CreatorId !== caller.getId()
        ) { 
            throw new Errors.AuthorizationError()
        }


        Application.validate({ ...application.dataValues, ...update })

        await this.store.Application.update({
            ...(update.accepted != null && {accepted: update.accepted}),
        }, { where: { id } })
    })}

    /**
     *
     * Delete an existing application
     *
     * Authorized Cases:
     * - An admin deleting an application
     * - A project creator deleting an application for a task they made
     *
     * @param {string} token - An authentication token for verifying authorization
     * @param {string} id - The application to operate on
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyNotFoundError} Thrown when the application could not be found
     * @throws {SwollySequelizeError}
     */
    async delete(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        const application = await this.store.Application.findByPk(id, {
            include: {
                model: this.store.Task,
                as: "task",
                include: {
                    model: this.store.Project,
                    as: "project"
                }
            }
        })
        if (application == null) {
            throw new Error.NotFoundError("Application could not be found.")
        }

        if(
            !caller.isAdmin
            || application.task.project.CreatorId !== caller.getId()
        ) { 
            throw new Errors.AuthorizationError()
        }

        await application.destroy()
    })}
}

module.exports = ApplicationRepository
