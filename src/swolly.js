const Utils = require("./utils");

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
        this.models = this.store.models
    }
}

module.exports = Swolly
