const Model = require('./model');
const Project = require('./project');

/**
 * Class representing a single image and its properties
 * */
class Image extends Model {
    /**
     * The constructor for this class.
     * 
     * @param {Model} instance - The sequelize model instance to build this object from
     * @param {Swolly} swolly - The swolly instance this instance belongs to
     * @param {string} [token] The session token this object was queried with
     *
     * */
    constructor (instance, swolly, token) {
        super(instance, swolly, token)
    }

    /**
     * Assigns this image to a project
     *
     * @param {string} projectId
     * */
    assign (projectId) {
        if (!this.isAuthenticed) {
            throw new Error()
        }

        this._swolly.Image.assign(this._callerToken, this._id, projectId)
    }

    /**
     * Unassigns this image from a project
     *
     * @param {string} projectId
     * */
    unassign (projectId) {
        if (!this.isAuthenticed) {
            throw new Error()
        }

        this._swolly.Image.unassign(this._callerToken, this._id, projectId)
    }

    /***
     * Returns the associated projects
     *
     * @param {object} [options] - See {@link ProjectRepository#getAll} for more information. "filter.imageId" will already be set. Note that location based queries are not supported for this getter.
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {Project[]}
     * */
    async getProjects(options = {}, filtered = this.isAuthenticated) {
        if (
            !filtered
            || !this.isAuthenticated
            || this._caller.isAdmin
        )
        options.location = undefined

        options.filter = options.filter == null ? {} : options.filter
        options.filter.imageId = this._id

        return this._swolly.Project.getAll(token, options)
    }
}

module.exports = Image

