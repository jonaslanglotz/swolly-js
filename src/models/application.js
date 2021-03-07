const Model = require("./model");
const User = require("./user");
const Task = require("./task");

const ApplicationValidationErrorCode = require("../enums/applicationValidationErrorCode");

/**
 * Class representing a single application and its properties
 * */
class Application extends Model {
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
        this._text = this._readScalar("name", "string")

        /** @type {boolean} */
        this._accepted = this._readScalar("accepted", "boolean")

        /** @type {string} */
        this._UserId = this._readScalar("UserId", "string")

        /** @type {string} */
        this._TaskId = this._readScalar("TaskId", "string")
    }

    /**
     * Validates a given object against certain rules
     * 
     * @param {object|Application} application - The object to validate
     *
     * */
    static validate(application) {
        if (application instanceof Application) {
            application = application.getData()
        }

        if (typeof application.text != "string") {
            throw new ValidationError(
                "text must be a string",
                ApplicationValidationErrorCode.TEXT_NOT_STRING
            )
        }

        if (typeof application.accepted != "boolean") {
            throw new ValidationError(
                "accepted must be a string",
                ApplicationValidationErrorCode.ACCEPTED_NOT_BOOLEAN
            )
        }
    }

    /***
     * Updates the database and this object with the provided values
     * 
     * @param {object} update - The object containing all the values to update.
     * */
    async update(update) {
        await this._swolly.Application.update(this._callerToken, this._id, update)
        await this.reload()
    }

    /***
     * Deletes this instance from the database
     * */
    async delete() {
        await this._swolly.Application.delete(this._callerToken, this._id)
    }


    /**
     * Outputs a (optionally un-)filtered object-representation of the contained data.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {object}
     * 
     * */
    async getData(filtered = this.isAuthenticated) {
        return {
            ...super.getData(filtered),
            text: await this.getText(filtered),
            accepted: this.getAccepted(filtered),
            UserId: await this.getUserId(filtered),
            TaskId: this.getTaskId(filtered)
        }
    }

    /***
     * Returns the value of 'text'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    async getText(filtered = this.isAuthenticated) {
        if (
            !this.isAuthenticated
            || this._caller.getId() == this._UserId
        ) {
            return this._text
        }

        const task = await this.getTask()
        const project = await task.getProject()
        const creatorId = await project.getCreatorId()

        if (this._caller.getId() == creatorId) {
            return this._text
        }

        return null
    }

    /***
     * Returns the value of 'accepted'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getAccepted(filtered = this.isAuthenticated) {
        return this._accepted
    }

    /***
     * Returns the value of 'UserId'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    async getUserId(filtered = this.isAuthenticated) {
        if (
            !this.isAuthenticated
            || this._caller.getId() == this._UserId
        ) {
            return this._UserId
        }

        const task = await this.getTask()
        const project = await task.getProject()
        const creatorId = await project.getCreatorId()

        if (this._caller.getId() == creatorId) {
            return this._UserId
        }

        return null
    }

    /***
     * Returns the value of 'TaskId'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getTaskId(filtered = this.isAuthenticated) {
        return this._TaskId
    }

    /***
     * Returns the associated user
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {User}
     * */
    async getUser(filtered = this.isAuthenticated) {
        if (
            !this.isAuthenticated
            || this._caller.getId() == this._UserId
        ) {
            return this._swolly.User.get(this._callerToken, this._UserId)
        }

        const task = await this.getTask()
        const project = await task.getProject()
        const creatorId = await project.getCreatorId()

        if (this._caller.getId() == creatorId) {
            return this._swolly.User.get(this._callerToken, this._UserId)
        }

        return null
    }

    /***
     * Returns the associated task
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Task}
     * */
    async getTask(filtered = this.isAuthenticated) {
        return this._swolly.Task.get(this._callerToken, this._TaskId)
    }
}

module.exports = Application


