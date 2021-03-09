const Model = require('./model');
const Session = require('./session');
const Project = require('./project');
const Task = require('./task');

const { ValidationError } = require('../errors');
const { UserValidationErrorCode, UserRole, UserGender  } = require('../enums');

/**
 * Class representing a single user and their properties
 * */
class User extends Model {
    /**
     * The constructor for this class.
     * 
     * @param {Sequelize.Model} instance - The sequelize model instance to build this object from
     * @param {Swolly} swolly - The swolly instance this instance belongs to
     * @param {string} [token] - The session token this object was queried with
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
        this._fullname = this._readScalar("fullname", "string")

        /** @type {string} */
        this._mail = this._readScalar("mail", "string")

        /** @type {string} */
        this._gender = this._readScalar("gender", "string")

        /** @type {string} */
        this._role = this._readScalar("role", "string")

        /** @type {string} */
        this._password = this._readScalar("password", "string")
    }

    get isSupporter() {
        return this.getRole() === "SUPPORTER"
    }

    get isInitiator() {
        return this.getRole() === "INITIATOR"
    }

    get isAdmin() {
        return this.getRole() === "ADMIN"
    }

    /***
     * Updates the database and this object with the provided values
     * 
     * @param {object} update - The object containing all the values to update.
     * */
    async update(update) {
        await this._swolly.User.update(this._callerToken, this._id, update)
        await this.reload()
    }

    /***
     * Deletes this instance from the database
     * */
    async delete() {
        await this._swolly.User.delete(this._callerToken, this._id)
    }


    /***
     * Deletes the session that this user instance is authenticated with and makes this a system instance
     * */
    async logout() {
        if (!this.isAuthenticated) {
            throw new Error("Unauthenticated instances can not be logged out.")
        }

        this._swolly.Session.deleteByToken(this._callerToken, this._callerToken)

        this.makeSystem()
    }

    /**
     * Validates a given object against certain rules
     * 
     * @param {object|User} user - The object to validate
     *
     * */
    static validate(user) {
        if (user instanceof User) {
            user = user.getData()
        }

        if (typeof user.password != "string") {
            throw new ValidationError(
                "password must be a string",
                UserValidationErrorCode.PASSWORD_NOT_STRING
            )
        }

        if (user.password.length < 8 ) {
            throw new ValidationError(
                "password must be atleast 8 characters long.",
                UserValidationErrorCode.PASSWORD_TOO_SHORT
            )
        }

        if (typeof user.mail != "string") {
            throw new ValidationError(
                "mail must be a string",
                UserValidationErrorCode.MAIL_NOT_STRING
            )
        }

        if (user.mail.length < 3) {
            throw new ValidationError(
                "mail must be atleast 3 characters long.",
                UserValidationErrorCode.MAIL_TOO_SHORT
            )
        }

        if (typeof user.fullname != "string") {
            throw new ValidationError(
                "fullname must be a string",
                UserValidationErrorCode.FULLNAME_NOT_STRING
            )
        }

        if (user.fullname.length < 3 ) {
            throw new ValidationError(
                "fullname must be atleast 3 characters long.",
                UserValidationErrorCode.FULLNAME_TOO_SHORT
            )
        }

        if (!Object.values(UserRole).includes(user.role)) {
            throw new ValidationError(
                `Unknown Role: '${user.role}'`,
                UserValidationErrorCode.ROLE_INVALID
            )
        }

        if (!Object.values(UserGender).includes(user.gender)) {
            throw new ValidationError(
                `Unknown Gender: '${user.gender}'`,
                UserValidationErrorCode.GENDER_INVALID
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
            fullname: this.getFullname(filtered),
            mail: this.getMail(filtered),
            gender: this.getGender(filtered),
            role: this.getRole(filtered),
            password: this.getPassword(filtered),
        }
    }

    /***
     * Returns the value of 'fullname' (filtered)
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getFullname(filtered = this.isAuthenticated) {
        return this._fullname
    }

    /***
     * Returns the value of 'mail' (filtered)
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getMail(filtered = this.isAuthenticated) {
        return this._mail 
    }

    /***
     * Returns the value of 'gender' (filtered)
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getGender(filtered = this.isAuthenticated) {
        return this._gender 
    }

    /***
     * Returns the value of 'role' (filtered)
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getRole(filtered = this.isAuthenticated) {
        return this._role 
    }

    /***
     * Returns the value of 'password' (filtered)
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getPassword(filtered = this.isAuthenticated) {
        if (
            !filtered
            || !this.isAuthenticated
        ) {
            return this._password 
        }
    }

    /***
     * Returns the session affiliated with this user
     *
     * @param {object} [options] - See {@link SessionRepository#getAll} for more information. "filter.userId" will already be set.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     *
     * @return {Session[]}
     * */
    async getSessions(options = {}, filtered = this.isAuthenticated) {
        if (
            !filtered
            || !this.isAuthenticated
            || this._caller.isAdmin
            || this._caller.getId() == this._id
        ) {
            options.filter = options.filter == null ? {} : options.filter
            options.filter.userId = this._id
            return await this._swolly.Session.getAll(this._callerToken, options)
        }
    }

    /***
     * Returns the projects created with this user
     *
     * @param {object} [options] - See {@link ProjectRepository#getAll} for more information. "filter.creatorId" will already be set.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Project[]}
     * */
    async getProjects(options = {}, filtered = this.isAuthenticated) {
            options.filter = options.filter == null ? {} : options.filter
            options.filter.creatorId = this._id
            return await this._swolly.Project.getAll(this._callerToken, options)
    }

    /***
     * Returns the tasks supported by this user
     *
     * @param {object} [options] - See {@link TaskRepository#getAll} for more information. "filter.supportedId" will already be set.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Task[]}
     * */
    async getSupportedTasks(options = {}, filtered = this.isAuthenticated) {
            options.filter = options.filter == null ? {} : options.filter
            options.filter.supporterId = this._id
            return await this._swolly.Task.getAll(this._callerToken, options)
    }
}

module.exports = User
