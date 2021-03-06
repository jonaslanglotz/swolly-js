const Repository = require("./repository")
const Category = require("../models/category")

/**
 * Repository for all methods relating to categories
 */
class CategoryRepository extends Repository {
    /**
     *
     * Get a listing of categories, optionally sorted and filtered
     *
     * Authorized Cases:
     * - Any registered user
     *
     * @param {string} token - An authentication token for verifying authorization
     *
     * @param {object} [options] An object with options
     *
     * @param {object} [options.sort] Describes how to sort the results
     * @param {CategorySortField} options.sort.field The field to sort by
     * @param {SortDirection} options.sort.direction The direction to sort in
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async getAll(token, options = {}) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        const { sort } = options

        const result = await this.store.Category.findAll({
            ...(sort != null && {order: [[sort.field, sort.direction]]})
        })

        return result == null ? [] : await Category.createFromArray(result, this.swolly, token, caller)
    })}

    /**
     *
     * Get a category by its id
     *
     * Authorized Cases:
     * - Any registered user
     *
     * @param {string} token - An authentication token for verifying authorization
     * @param {object} id - The id of the requested category
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollySequelizeError}
     */
    async get(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)
        const result = await this.store.Category.findByPk(id)
        return result == null ? null : await Category.create(result, this.swolly, token, caller)
    })}

    /**
     *
     * Create a new category
     *
     * Authorized Cases:
     * - An admin creating a new category
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {object} category - The object containing the values of the category
     * @param {string} category.fullname - Name of the category
     * @param {string} category.ImageId - Id of the image this Category should have
     *
     * @return {Category}
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the category is not correct in some way (see {@link CategoryValidationErrorCode} for codes)
     * @throws {SwollySequelizeError}
     */
    async create(token, values) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        if(!caller.isAdmin) { 
            throw new Errors.AuthorizationError()
        }

        Category.validate(values)

        try {
            const category = await this.store.Category.create({
                name: values.name,
                ImageId: values.ImageId,
            })
            return await Category.create(category, this.swolly, token)
        } catch (err) {
            if (err instanceof Sequelize.ForeignKeyConstraintError) {
                throw new Errors.ValidationError(
                    "This image does not exist.",
                    Enums.CategoryValidationErrorCode.IMAGE_INVALID
                )
            }
            throw err
        }
    })}

    /**
     *
     * Update an existing category
     *
     * Authorized Cases:
     * - An admin updating a category
     *
     * @param {string} token - A authentication token for verifying authorization
     *
     * @param {string} id - The category to operate on
     *
     * @param {object} category - The object containing the values of the category
     * @param {string} [category.name] - New name of the category
     * @param {string} [category.ImageId] - New image id of the image belonging to this category
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyValidationError} Thrown when the category is not correct in some way (see {@link CategoryValidationErrorCode} for codes)
     * @throws {SwollyNotFoundError} Thrown when the category could not be found
     * @throws {SwollySequelizeError}
     */
    async update(token, id, update) { return Repository._rethrow(async () => {
        if (update && Object.keys(update).length === 0) {
            return
        }

        const caller = await this._getAuth(token)
        if(!caller.isAdmin) { 
            throw new Errors.AuthorizationError()
        }

        const category = await this.store.Category.findByPk(id)
        if (category == null) {
            throw new Error.NotFoundError("Category could not be found.")
        }

        Category.validate({ ...category.dataValues, ...update })
        
        try {
            await this.store.Category.update({
                ...(update.name != null && {name: update.name}),
                ...(update.ImageId != null && {ImageId: update.ImageId})
            }, { where: { id } })
        } catch (err) {
            if (err instanceof Sequelize.ForeignKeyConstraintError) {
                throw new Errors.ValidationError(
                    "This image does not exist.",
                    Enums.CategoryValidationErrorCode.IMAGE_INVALID
                )
            }
            throw err
        }
    })}

    /**
     *
     * Delete an existing category
     *
     * Authorized Cases:
     * - An admin deleting a category
     *
     * @param {string} token - An authentication token for verifying authorization
     * @param {string} id - The category to operate on
     *
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could either not be authenticated or is not authorized.
     * @throws {SwollyNotFoundError} Thrown when the category could not be found
     * @throws {SwollySequelizeError}
     */
    async delete(token, id) { return Repository._rethrow(async () => {
        const caller = await this._getAuth(token)

        if(!caller.isAdmin) { 
            throw new Errors.AuthorizationError()
        }

        const category = await this.store.Category.findByPk(id)
        if (category == null) {
            throw new Error.NotFoundError("Category could not be found.")
        }

        await category.destroy()
    })}
}

module.exports = CategoryRepository

