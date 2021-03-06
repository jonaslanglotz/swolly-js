const Model = require("./model");
const Session = require("./session");
const Project = require("./project");
const Task = require("./task");

const CategoryValidationErrorCode = require("../enums/categoryValidationErrorCode");

/**
 * Class representing a single category and its properties
 * */
class Category extends Model {
    /**
     * The constructor for this class.
     * 
     * @param {Sequelize.Model} instance The sequelize model instance to build this object from
     * @param {Swolly} swolly - The swolly instance this instance belongs to
     * @param {string} [token] The session token this object was queried with
     *
     * */
    constructor (instance, swolly, token) {
        super(instance, swolly, token)
        this._loadInstance()
    }

    /**
     * Loads all values relevant to this class from the provided instance.
     * */
    _loadInstance() {
        super._loadInstance()

        /** @type {string} */
        this._name = this._readScalar("name", "string")
        this._ImageId = this._readScalar("ImageId", "string")
    }

    /**
     * Validates a given object against certain rules
     * 
     * @param {object|User} user - The object to validate
     *
     * */
    static validate(category) {
        if (category instanceof Category) {
            category = category.getData()
        }

        if (typeof category.name != "string") {
            throw new ValidationError(
                "name must be a string",
                CategoryValidationErrorCode.NAME_NOT_STRING
            )
        }

        if (category.name.length < 3 ) {
            throw new ValidationError(
                "name must be atleast 3 characters long.",
                UserValidationErrorCode.NAME_TOO_SHORT
            )
        }
    }

    /***
     * Updates the database and this object with the provided values
     * 
     * @param {object} update - The object containing all the values to update.
     * */
    async update(update) {
        await this._swolly.Category.update(this._callerToken, this._id, update)
        await this.reload()
    }

    /***
     * Deletes this instance from the database
     * */
    async delete() {
        await this._swolly.Category.delete(this._callerToken, this._id)
    }


    /**
     * Outputs a (optionally un-)filtered object-representation of the contained data.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {object}
     * 
     * */
    getData(filtered = this.isAuthenticated) {
        return {
            ...super.getData(filtered),
            name: this.getName(filtered),
            ImageId: this.getImageId(filtered)
        }
    }

    /***
     * Returns the value of 'name'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getName(filtered = this.isAuthenticated) {
        return this._name
    }

    /***
     * Returns the value of 'name'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getName(filtered = this.isAuthenticated) {
        return this._ImageId
    }

    /***
     * Returns the associated projects
     *
     * @param {object} [options] - See {@link ProjectRepository#getAll} for more information. "filter.categoryId" will already be set.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     *
     * @return {Project[]}
     * */
    async getProjects(options = {}, filtered = this.isAuthenticated) {
        options.filter = options.filter == null ? {} : options.filter
        options.filter.categoryId = this._id
        return this._swolly.Project.getAll(this._callerToken, options)
    }

    /***
     * Returns the associated image
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Image}
     * */
    async getImage(filtered = this.isAuthenticated) {
        return this._swolly.Image.get(this._callerToken, this._ImageId)
    }
}

module.exports = Category

