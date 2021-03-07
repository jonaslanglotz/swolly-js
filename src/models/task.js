const Model = require('./model');
const Project = require('./project');
const User = require('./user');
const { ValidationError } = require("../errors");
const { TaskValidationErrorCode } = require("../enums");

/**
 * Class representing a single task and its properties
 * */
class Task extends Model {
    /**
     * The constructor for this class.
     * 
     * @param {Sequelize.Model} instance - The sequelize model instance to build this object from
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

        /** @type {int} */
        this._supporterGoal = this._readScalar("supporterGoal", "number")

        /** @type {string} */
        this._ProjectId = this._readScalar("ProjectId", "string")
    }

    /***
     * Deletes this instance from the database
     * */
    async delete() {
        await this._swolly.Task.delete(this._callerToken, this._id)
    }

    /***
     * Updates the database and this object with the provided values
     * 
     * @param {object} update - The object containing all the values to update.
     * */
    async update(update) {
        await this._swolly.Task.update(this._callerToken, this._id, update)
        await this.reload()
    }

    /***
     * Sends a user application for a task. User is the caller.
     * 
     * @param {string} application
     * */
    async apply(userId, application) {
        await this._swolly.Task.apply(this._callerToken, this._id, application)
    }

    /**
     * Validates a given object against certain rules
     * 
     * @param {object|Task} task - The object to validate
     *
     * */
    static validate(task) {
        if (task instanceof Task) {
            task = task.getData()
        }

        if (typeof task.title != "string") {
            throw new ValidationError(
                "title must be a string",
                TaskValidationErrorCode.TITLE_NOT_STRING
            )
        }

        if (task.title.length < 3 ) {
            throw new ValidationError(
                "title must be atleast 3 characters long.",
                TaskValidationErrorCode.TITLE_TOO_SHORT
            )
        }

        if (typeof task.description != "string") {
            throw new ValidationError(
                "description must be a string",
                TaskValidationErrorCode.DESCRIPTION_NOT_STRING
            )
        }

        if (typeof task.supporterGoal != "number") {
            throw new ValidationError(
                "supporterGoal must be a number",
                TaskValidationErrorCode.SUPPORTER_GOAL_NOT_NUMBER
            )
        }

        if (task.supporterGoal < 1 || task.supporterGoal > 1000000000) {
            throw new ValidationError(
                "supporterGoal must be atleast 1",
                TaskValidationErrorCode.SUPPORTER_GOAL_OUT_OF_RANGE
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
        return {
            ...super.getData(filtered),
            title: this.getTitle(filtered),
            description: this.getDescription(filtered),
            supporterGoal: this.getSupporterGoal(filtered),
            ProjectId: this.getProjectId(filtered),
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
     * Returns the value of 'supporterGoal'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getSupporterGoal(filtered = this.isAuthenticated) {
        return this._supporterGoal
    }

    /***
     * Returns the value of 'ProjectId'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getProjectId(filtered = this.isAuthenticated) {
        return this._ProjectId
    }

    /***
     * Returns the associated project
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Project}
     * */
    async getProject(filtered = this.isAuthenticated) {
        return this._swolly.Project.get(this._callerToken, this._instance.ProjectId)
    }

    /***
     * Returns the associated applications
     *
     * @param {object} [options] - See {@link ApplicationRepository#getAll} for more information. "filter.taskId" will already be set.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Application[]}
     * */
    async getApplications(options = {}, filtered = this.isAuthenticated) {
        options.filter = options.filter == null ? {} : options.filter
        options.filter.taskId = this._id
        return this._swolly.Application.getAll(this._callerToken, options)
    }
}

module.exports = Task
