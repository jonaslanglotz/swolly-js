const Utils = require("./utils")

const CategoryRepository = require("./repositories/category")
const ImageRepository = require("./repositories/image")
const ProjectRepository = require("./repositories/project")
const SessionRepository = require("./repositories/session")
const TaskRepository = require("./repositories/task")
const UserRepository = require("./repositories/user")

const Errors = require("./errors")

/**
 * This is the main class, the entry point to swolly.
 */
class Swolly {
    /**
     * Instantiate swolly with database connection details and options
     *
     * @param {object}  options={} - An object with options.
     * @param {string}  options.dataFolder - The folder in which to store files
     */
    constructor(options={}) {
        const { dataFolder } = options

        if (dataFolder == null) {
            throw new Error("options.dataFolder may not be null.")
        }

        this.dataFolder = dataFolder
    }

    /**
     * Connect to the database using sequelize.
     *
     * @param {object}  sequelize - An object defining how sequelize is initialized.
     * @param {string}  sequelize.connectionURI - The connection URI to be passed through to sequelize.
     * @param {boolan}  sequelize.alter - If sequelize should fix the database.
     * @param {object}  sequelize.options - The options to be passed through to sequelize.
     */
    async authenticate(sequelize) {
        try {
            const store = await Utils.createStore(sequelize.connectionURI, sequelize.options, sequelize.alter)
            /** @type {Sequelize} */
            this.store = { sequelize: store, ...store.models }
        } catch(err) {
            throw new Errors.SequelizeError(err.message)
        }

        /** @type {CategoryRepository} */
        this.Category = new CategoryRepository(this)
        /** @type {ImageRepository} */
        this.Image = new ImageRepository(this)
        /** @type {ProjectRepository} */
        this.Project = new ProjectRepository(this)
        /** @type {SessionRepository} */
        this.Session = new SessionRepository(this)
        /** @type {TaskRepository} */
        this.Task = new TaskRepository(this)
        /** @type {UserRepository} */
        this.User = new UserRepository(this)
    }
}

module.exports = Swolly
