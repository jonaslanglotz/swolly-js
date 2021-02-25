const Utils = require("./utils");

const CategoryMixin = require("./mixins/category")
const ImageMixin = require("./mixins/image")
const ProjectMixin = require("./mixins/project")
const SessionMixin = require("./mixins/session")
const TaskMixin = require("./mixins/task")
const UserMixin = require("./mixins/user")

/**
 * This is the main class, the entry point to swolly.
 */
class Swolly {
    /**
     * Instantiate swolly with database connection details and options
     *
     * @param {string}  [sequelize.connectionURI] The connection URI to be passed through to sequelize.
     * @param {object}  [sequelize.options] The options to be passed through to sequelize.
     * @param {object}  [options={}] An object with options.
     */
    constructor(sequelize, options={}) {
        this.sequelizeOptions = sequelize
    }

    /**
     * Initialize connection to database.
     */
    async authenticate() {
        this.store = await Utils.createStore(this.sequelizeOptions.connectionURI, this.sequelizeOptions.options)

        this.Category = new CategoryMixin(this)
        this.Image = new ImageMixin(this.store)
        this.Project = new ProjectMixin(this.store)
        this.Session = new SessionMixin(this.store)
        this.Task = new TaskMixin(this.store)
        this.User = new UserMixin(this.store)
    }
}

module.exports = Swolly
