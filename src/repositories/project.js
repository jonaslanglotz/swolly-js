const Repository = require("./repository")
const Project = require("../models/project")
const Errors = require("../errors")
const { QueryTypes, Sequelize } = require("sequelize")

const ProjectStatus = require("../enums/projectStatus")

/**
 * Repository for all methods relating to projects
 */
class ProjectRepository extends Repository {
    /**
     *
     * Get a listing of projects, optionally filtered and sorted
     *
     * Authorized Cases:
     * - Any registered user
     *
     * @param {string} token - An authentication token for verifying authorization
     *
     * @param {object} [options] An object with options
     *
     * @param {object} [options.filter] Describes how to filter the results
     * @param {string} [options.filter.categoryId] Filters result down to projects of a category
     * @param {string} [options.filter.creatorId] Filters result down to projects created by a user
     * @param {string} [options.filter.imageId] Filters result down to projects using this image (Not available when querying by location)
     * @param {ProjectStatus} [options.filter.status] Filters result down to projects with a specific status
     *
     * @param {object} [options.sort] Describes how to sort the results (Note: This is overidden by options.location)
     * @param {ProjectSortField} options.sort.field - The field to sort by
     * @param {SortDirection} options.sort.direction - The direction to sort in
     *
     * @param {object} [options.location] Describes how to sort the results
     * @param {number} options.location.lat - The latitude of the location to use as the origin for the search
     * @param {number} options.location.lon - The longitude of the location to use as the origin for the search
     * @param {number} [options.location.maxDistance=15000] - The maximum distance to search in
     *
     * @param {boolean} [options.showHidden] Whether to show projects that are not publicly listed
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async getAll(token, options = {}) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        let { filter, sort, location, showHidden=false } = options

        if (!showHidden) {
            if (
                filter != null
                && filter.status != null
                && filter.status != ProjectStatus.PUBLIC
            ) {
                console.warn(
                    "ProjectRepostiory.getAll was called as such"
                    + "that only non-public projects would be shown, "
                    + "but showHidden was set to false",
                    (new Error().trace)
                )
                return []
            }

            // filter.status must either be "PUBLIC" or undefined now
            filter = filter == null ? {} : filter
            filter.status = ProjectStatus.PUBLIC
        }

        let result = []

        if (location != null) {
            const { lat, lon, maxDistance=15000 } = location

            let condition = "TRUE"
            if (filter != null) {
                if (filter.categoryId != null) {
                    condition += " AND " + `CategoryId = ${this.store.sequelize.escape(filter.categoryId)}` 
                }
                if (filter.creatorId != null) {
                    condition += " AND " + `CreatorId = ${this.store.sequelize.escape(filter.creatorId)}`
                }
                if (filter.status != null) {
                    condition += " AND " + `status = ${this.store.sequelize.escape(filter.status)}`
                }
            }

            let [results, metadata] = await this.store.sequelize.query("CALL FindNearest(:lat, :lon, :startDistance, :maxDistance, :limit, :condition, :table);", {
                replacements: {
                    lat,
                    lon,
                    startDistance: 10,
                    maxDistance,
                    limit: 1000,
                    condition,
                    table: "Projects"
                },
                type: QueryTypes.SELECT
            })

            for (const [key, value] of Object.entries(results)) {
                if (key != "meta") {
                    result.push(value);
                }
            }

        } else {
            result = await this.store.Project.findAll({
                ...(filter != null && {where: {
                    ...(filter.categoryId != null && {CategoryId: filter.categoryId}),
                    ...(filter.creatorId != null && {CreatorId: filter.creatorId}),
                    ...(filter.status != null && {status: filter.status})
                }}),
                ...(sort != null && {order: [[sort.field, sort.direction]]}),
                ...(filter != null && filter.imageId != null && { include: {
                    model: this.store.Image,
                    as: "images",
                    through: {
                        where: {
                            ImageId: filter.imageId
                        }
                    }
                }}),
            })
        }

        return result == null ? [] : await Project.createFromArray(result, this.swolly, token, caller)
    })}

    /**
     *
     * Get project object by its id
     *
     * Authorized Cases:
     * - Any registered user
     *
     * @param {string} token - A authentication token for verifying authorization
     * @param {string} id - A valid project id
     *
     * @return {Project}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async get(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const result = await this.store.Project.findByPk(id)
        return result == null ? null : await Project.create(result, this.swolly, token, caller)
    })}

    /**
     *
     * Create a new Project
     *
     * Authorized Cases:
     * - An admin creating a new project
     * - A supporter creating a new project
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {object} values - The object containing the values of the project
     * @param {string} values.title - Title of the project
     * @param {string} values.description - Description of the project
     * @param {ProjectStatus} [values.status="NEEDS_VERIFICATION"] - Status of the project (only for admins)
     * @param {number} values.moneyGoal - MoneyGoal for the project
     * @param {number} values.lat - Latitude of the project
     * @param {number} values.lon - Longitude of the project
     * @param {string} [values.CreatorId=self] - Id of the user creating this project (only for admins)
     * @param {string} values.CategoryId - Id of the category this project should belong to
     *
     * @return {Project}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the project is not correct in some way (see {@link ProjectValidationErrorCode} for codes)
     * @throws {SwollySequelizeError}
     */
    async create(token, values) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        if(!caller.isAdmin && !caller.isInitiator) { 
            throw new Errors.AuthorizationError()
        }

        if (values && values.status == null) {
            values.status = ProjectStatus.NEEDS_VERIFICATION
        }

        if (values && values.CreatorId == null) {
            values.CreatorId = caller.getId()
        }

        Project.validate(values)

        if (!caller.isAdmin && values.status != ProjectStatus.NEEDS_VERIFICATION) {
            throw new Errors.AuthorizationError()
        }

        if (!caller.isAdmin && values.CreatorId != null && values.CreatorId != caller.getId()) {
            throw new Errors.AuthorizationError()
        }

        try {
            const project = await this.store.Project.create({
                title: values.title,
                description: values.description,
                status: values.status,
                moneyGoal: values.moneyGoal,
                lat: values.lat,
                lon: values.lon,
                CreatorId: values.CreatorId,
                CategoryId: values.CategoryId,
            })
            return await Project.create(project, this.swolly, token)
        } catch (err) {
            // if (err instanceof Sequelize.ForeignKeyConstraintError) {
            //     throw new Errors.ValidationError(
            //         "This image does not exist.",
            //         Enums.CategoryValidationErrorCode.IMAGE_INVALID
            //     )
            // }
            throw err
        }
    })}

    /**
     *
     * Update an existing project
     *
     * Authorized Cases:
     * - An admin updating a project
     * - A supporter updating a project they own
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {string} id - The project to operate on
     *
     * @param {object} update - The object containing the values of the project
     * @param {string} [update.title] - Title of the project
     * @param {string} [update.description] - Description of the project
     * @param {ProjectStatus} [update.status] - Status of the project (only for admins)
     * @param {number} [update.moneyGoal] - MoneyGoal for the project
     * @param {number} [update.lat] - Latitude of the project
     * @param {number} [update.lon] - Longitude of the project
     * @param {string} [update.CreatorId] - Id of the user creating this project (only for admins)
     * @param {string} [update.CategoryId] - Id of the category this project should belong to
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the project is not correct in some way (see {@link ProjectValidationErrorCode} for codes)
     * @throws {SwollyNotFoundError} Thrown when the project could not be found
     * @throws {SwollySequelizeError}
     */
    async update(token, id, update) { return Repository._rethrow(async () => {
        if (update && Object.keys(update).length === 0) {
            return
        }

        const caller = await this._getAuth(token)

        const project = await this.store.Project.findByPk(id)
        if (project == null) {
            throw new Error.NotFoundError("project could not be found.")
        }

        if(
            !caller.isAdmin
            && (
                update.status == ProjectStatus.NEEDS_VERIFICATION
                || category.getStatus() == ProjectStatus.NEEDS_VERIFICATION
            )
        ) { 
            throw new Errors.AuthorizationError()
        }

        if(
            !caller.isAdmin
            && update.CreatorId != null
            && update.CreatorId === caller.getId()
        ) { 
            throw new Errors.AuthorizationError()
        }

        Project.validate({ ...project.dataValues, ...update })
        
        try {
            await this.store.Project.update({
                ...(update.title != null && {title: update.title}),
                ...(update.description != null && {description: update.description}),
                ...(update.status != null && {status: update.status}),
                ...(update.moneyGoal != null && {moneyGoal: update.moneyGoal}),
                ...(update.lat != null && {lat: update.lat}),
                ...(update.lon != null && {lon: update.lon}),
                ...(update.CreatorId != null && {CreatorId: update.CreatorId}),
                ...(update.CategoryId != null && {CategoryId: update.CategoryId})
            }, { where: { id } })
        } catch (err) {
            // if (err instanceof Sequelize.ForeignKeyConstraintError) {
            //     throw new Errors.ValidationError(
            //         "This image does not exist.",
            //         Enums.CategoryValidationErrorCode.IMAGE_INVALID
            //     )
            // }
            throw err
        }
    })}

    /**
     *
     * Delete an existing project
     *
     * Authorized Cases:
     * - An admin deleting a project
     * - A supporter deleting a project they own
     *
     * @param {string} token - An authentication token for verifying authorization
     * @param {string} id - The project to operate on
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyNotFoundError} Thrown when the project could not be found
     * @throws {SwollySequelizeError}
     */
    async delete(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        const project = await this.store.Project.findByPk(id)
        if (project == null) {
            throw new Error.NotFoundError("Category could not be found.")
        }

        if(!caller.isAdmin && project.CreatorId == caller.getId()) { 
            throw new Errors.AuthorizationError()
        }


        await project.destroy()
    })}

}

module.exports = ProjectRepository
