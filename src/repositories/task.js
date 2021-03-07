const Repository = require("./repository")
const Task = require("../models/task")
const Errors = require("../errors")

/**
 * Repository for all methods relating to tasks
 */
class TaskRepository extends Repository {
    /**
     *
     * Get a listing of tasks, optionally filtered and sorted
     *
     * Authorized Cases:
     * - Any registered user
     *
     * @param {string} token - An authentication token for verifying authorization
     *
     * @param {object} [options] An object with options
     *
     * @param {object} [options.filter] Describes how to filter the results
     * @param {string} [options.filter.projectId] Filters result down to tasks of a project
     * @param {string} [options.filter.supporterId] Filters result down to tasks supported by a user
     *
     * @param {object} [options.sort] Describes how to sort the results
     * @param {TaskSortField} [options.sort.field] The field to sort by
     * @param {SortDirection} [options.sort.direction] The direction to sort in
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     *
     * @return {Task[]}
     */
    async getAll(token, options = {}) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        let { filter, sort } = options

        const result = await this.store.Task.findAll({
            ...(filter != null && {where: {
                ...(filter.projectId != null && {ProjectId: filter.projectId}),
            }}),
            ...(sort != null && {order: [[sort.field, sort.direction]]}),
            ...(filter != null && filter.supporterId != null && { include: {
                model: this.store.User,
                as: "supporters",
                through: {
                    where: {
                        UserId: filter.supporterId
                    }
                }
            }}),
        })

        return result == null ? [] : await Task.createFromArray(result, this.swolly, token, caller)
    })}

    /**
     *
     * Get task object by its id
     *
     * Authorized Cases:
     * - Any registered user
     *
     * @param {string} token - A authentication token for verifying authorization
     * @param {string} id - A valid task id
     *
     * @return {Task}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async get(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const result = await this.store.Task.findByPk(id)
        return result == null ? null : await Task.create(result, this.swolly, token, caller)
    })}


    /**
     *
     * Create a new task
     *
     * Authorized Cases:
     * - An admin creating a new task
     * - A project owner creating a new task on their project
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {object} task - The object containing the values of the task
     * @param {string} task.title - Title of the task
     * @param {string} task.description - Description of the task
     * @param {number} task.supporterGoal - Supporter goal of the task
     * @param {string} task.ProjectId - The project this task should be assigned to
     *
     * @return {Task}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the task is not correct in some way (see {@link TaskValidationErrorCode} for codes)
     * @throws {SwollySequelizeError}
     */
    async create(token, values) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        Task.validate(values)

        const project = await this.store.Project.findByPk(values.projectId)

        if (project == null) {
            throw new Errors.NotFoundError("Project not found.")
        }

        if(
            !caller.isAdmin
            && project.CreatorId !== caller.getId()
        ) { 
            throw new Errors.AuthorizationError()
        }

        const task = await project.createTask({
            title: values.title,
            description: values.description,
            supporterGoal: values.supporterGoal,
        })

        return await Task.create(task, this.swolly, token)
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
     * @param {string} id - The task to operate on
     *
     * @param {object} update - The object containing the values of the task
     * @param {string} [update.title] - Title of the task
     * @param {string} [update.description] - Description of the task
     * @param {number} [update.supporterGoal] - Supporter goal of the task
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the task is not correct in some way (see {@link TaskValidationErrorCode} for codes)
     * @throws {SwollyNotFoundError} Thrown when the task could not be found
     * @throws {SwollySequelizeError}
     */
    async update(token, id, update) { return Repository._rethrow(async () => {
        if (update && Object.keys(update).length === 0) {
            return
        }

        const caller = await this._getAuth(token)

        const task = await this.store.Task.findByPk(id, {
            include: {
                model: this.store.Project,
                as: "project"
            }
        })
        if (task == null) {
            throw new Error.NotFoundError("Task could not be found.")
        }


        if(
            !caller.isAdmin
            && task.project.CreatorId !== caller.getId()
        ) { 
            throw new Errors.AuthorizationError()
        }


        Task.validate({ ...task.dataValues, ...update })

        await this.store.Task.update({
            ...(update.title != null && {title: update.title}),
            ...(update.description != null && {description: update.description}),
            ...(update.supporterGoal != null && {supporterGoal: update.supporterGoal}),
        }, { where: { id } })
    })}

    /**
     *
     * Delete an existing task
     *
     * Authorized Cases:
     * - An admin deleting a task
     * - A project creator deleting a task they made
     *
     * @param {string} token - An authentication token for verifying authorization
     * @param {string} id - The task to operate on
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyNotFoundError} Thrown when the task could not be found
     * @throws {SwollySequelizeError}
     */
    async delete(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        const task = await this.store.Task.findByPk(id, {
            include: {
                model: this.store.Project,
                as: "project"
            }
        })
        if (task == null) {
            throw new Error.NotFoundError("Task could not be found.")
        }

        if(
            !caller.isAdmin
            && task.project.CreatorId !== caller.getId()
        ) { 
            throw new Errors.AuthorizationError()
        }

        await task.destroy()
    })}
}

module.exports = TaskRepository
