const Model = require('./model');
const User = require('./user');
const Category = require('./category');
const Task = require('./task');
const Image = require('./image');

const Enums = require('../enums');


/**
 * Class representing a single project and its properties
 * */
class Project extends Model {
    /**
     * The constructor for this class.
     * 
     * @param {SequelizeModel} instance - The sequelize model instance to build this object from
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
        this._title = this._readScalar("title", "string")

        /** @type {string} */
        this._description = this._readScalar("description", "string")

        /** @type {string} */
        this._status = this._readScalar("status", "string")

        /** @type {number} */
        this._moneyGoal = this._readScalar("moneyGoal", "number")

        /** @type {number} */
        this._moneyPledged = this._readScalar("moneyPledged", "number")

        /** @type {number} */
        this._lat = this._readScalar("lat", "number")

        /** @type {number} */
        this._lon = this._readScalar("lon", "number")

        /** @type {string} */
        this._CreatorId = this._readScalar("CreatorId", "string")

        /** @type {string} */
        this._CategoryId = this._readScalar("CategoryId", "string")
    }

    /***
     * Updates the database and this object with the provided values
     * 
     * @param {object} update - The object containing all the values to update.
     * */
    async update(update) {
        await this._swolly.Project.update(this._callerToken, this._id, update)
        await this.reload()
    }

    /***
     * Deletes this instance from the database
     * */
    async delete() {
        await this._swolly.Project.delete(this._callerToken, this._id)
    }

    /**
     * Validates a given object against certain rules
     * 
     * @param {object|Project} project - The object to validate
     *
     * */
    static validate(project) {
        if (project instanceof Project) {
            project = project.getData()
        }

        if (typeof project.title != "string") {
            throw new ValidationError(
                "title must be a string",
                CategoryValidationErrorCode.TITLE_NOT_STRING
            )
        }

        if (project.title.length < 3 ) {
            throw new ValidationError(
                "title must be atleast 3 characters long.",
                UserValidationErrorCode.TILE_TOO_SHORT
            )
        }

        if (typeof project.description != "string") {
            throw new ValidationError(
                "description must be a string",
                CategoryValidationErrorCode.DESCRIPTION_NOT_STRING
            )
        }

        if (!Object.values(Enums.ProjectStatus).includes(project.status)) {
            throw new ValidationError(
                "status is not a valid status",
                CategoryValidationErrorCode.STATUS_INVALID
            )
        }

        if (typeof project.moneyGoal != "number") {
            throw new ValidationError(
                "moneyGoal must be a number",
                CategoryValidationErrorCode.MONEY_GOAL_NOT_NUMBER
            )
        }

        if (project.moneyGoal < 0) {
            throw new ValidationError(
                "moneyGoal must atleast zero",
                CategoryValidationErrorCode.MONEY_GOAL_NEGATIVE
            )
        }

        if (typeof project.lat != "number") {
            throw new ValidationError(
                "lat must be a number",
                CategoryValidationErrorCode.LAT_NOT_NUMBER
            )
        }

        if (project.lat < -90 || project.lat > 90) {
            throw new ValidationError(
                "lat must be between -90 and 90",
                CategoryValidationErrorCode.LAT_OUT_OF_RANGE
            )
        }

        if (typeof project.lon != "number") {
            throw new ValidationError(
                "lon must be a number",
                CategoryValidationErrorCode.LON_NOT_NUMBER
            )
        }

        if (project.lon < -180 || project.lon > 180) {
            throw new ValidationError(
                "lon must be between -180 and 180",
                CategoryValidationErrorCode.LON_OUT_OF_RANGE
            )
        }
    }


    /**
     * Outputs a (optionally un-)filtered object-representation of the contained data.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {object}
     * 
     * */
    getData(filtered = this.isAuthenticated) {
        if (
            !filtered
            || !this.isAuthenticated
            || this.isPublic
            || this._caller.isAdmin
            || this._instance.CreatorId === this._caller.getId()
        ) {
            return {
                ...super.getData(filtered),
                title: this.getTitle(filtered),
                description: this.getDescription(filtered),
                status: this.getStatus(filtered),
                moneyGoal: this.getMoneyGoal(filtered),
                moneyPledged: this.getMoneyPledged(filtered),
                lat: this.getLat(filtered),
                lon: this.getLon(filtered),
                CreatorId: this.getCreatorId(filtered),
                CategoryId: this.getCategoryId(filtered),
            }
        }
    }

    /***
     * Returns the value of 'title'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getTitle(filtered = this.isAuthenticated) {
        return this._title
    }

    /***
     * Returns the value of 'description'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getDescription(filtered = this.isAuthenticated) {
        return this._description
    }

    /***
     * Returns the value of 'status'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getStatus(filtered = this.isAuthenticated) {
        return this._status
    }

    /***
     * Returns the value of 'moneyGoal'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {number}
     * */
    getMoneyGoal(filtered = this.isAuthenticated) {
        return this._moneyGoal
    }

    /***
     * Returns the value of 'moneyPledged'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {number}
     * */
    getMoneyPledged(filtered = this.isAuthenticated) {
        return this._moneyPledged
    }

    /***
     * Returns the value of 'lat'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {number}
     * */
    getLat(filtered = this.isAuthenticated) {
        return this._lat
    }

    /***
     * Returns the value of 'lon'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {number}
     * */
    getLon(filtered = this.isAuthenticated) {
        return this._lon
    }

    /***
     * Returns the value of 'CreatorId'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getCreatorId(filtered = this.isAuthenticated) {
        return this._CreatorId
    }

    /***
     * Returns the value of 'CategoryId'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getCategoryId(filtered = this.isAuthenticated) {
        return this._CategoryId
    }

    /***
     * Returns the associated creator
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {User}
     * */
    async getCreator(filtered = this.isAuthenticated) {
        return this._swolly.User.get(this._callerToken, this._CreatorId);
    }

    /***
     * Returns the associated category
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Category}
     * */
    async getCategory(filtered = this.isAuthenticated) {
        return this._swolly.Category.get(this._callerToken, this._CategoryId);
    }

    /***
     * Returns the associated tasks
     *
     * @param {object} [options] - See {@link TaskRepository#getAll} for more information. "filter.projectId" will already be set.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Task[]}
     * */
    async getTasks(options = {}, filtered = this.isAuthenticated) {
        options.filter = options.filter == null ? {} : options.filter
        options.filter.projectId = this._id
        return this._swolly.Task.getAll(this._callerToken, options)
    }

    /***
     * Returns the associated images
     *
     * @param {object} [options] - See {@link ImageRepository#getAll} for more information. "filter.projectId" will already be set.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Image[]}
     * */
    async getImages(options = {}, filtered = this.isAuthenticated) {
        options.filter = options.filter == null ? {} : options.filter
        options.filter.projectId = this._id
        return this._swolly.Task.getAll(this._callerToken, options)
    }

}

module.exports = Project
