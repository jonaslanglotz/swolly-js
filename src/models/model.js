const { BaseError: SequelizeBaseError } = require('sequelize');
const Errors = require("../errors")
const Sequelize = require("sequelize")

class Model {
    /**
     * The constructor for this class.
     *
     * The token property may optionally be left away. In this case the instance will be considered to belong to the system instead of a specific user. There will be no restriction on functionality, all methods will be allowed, but outputing filtered data will result in a warning message. On the other hand, outputting unfiltered data from an identifiable instance will also result in a warning.
     *
     * @param {Sequelize.Model} instance - The sequelize model instance to build this object from
     * @param {Swolly} swolly - The swolly instance this instance belongs to
     * @param {string} [token] - The session token this object was queried with.
     *
     * */
    constructor (instance, swolly, token) {
        if(!(swolly instanceof require("../swolly"))) {
            throw new TypeError("swolly is not a swolly instance")
        }

        /** @type {Swoly} */
        this._swolly = swolly

        /** @type {Sequelize} */
        this._sequelize = swolly.store

        if (typeof token !== "string") token = null

        /** @type {string} */
        this._callerToken = token

        /** @type {User} */
        this._caller = null

        /** @type {object} */
        this._instance = instance

        this._loadInstance()
    }

    /**
     * Loads all values relevant to this class from the provided instance.
     * */
    _loadInstance() {
        /** @type {string} */
        this._id = this._readScalar("id", "string")

        /** @type {Date} */
        this._createdAt = this._readScalar("createdAt", "object")

        /** @type {Date} */
        this._updatedAt = this._readScalar("updatedAt", "object")
    }

    /**
     * Reloads all values from the database.
     * */
    async reload() {
        await this._instance.reload()
        _loadInstance()
    }

    /**
     * Changes the token, if this instance is not yet authenticated.
     *
     * @param {string} token - The token to set the property to
     *
     * @throws {TypeError} Thrown when the provided token is not a string.
     * @throws {Error} Thrown when this instance is already authenticated.
     *
     * */
    setCallerToken(token) {
        if (typeof token != "string") {
            throw new TypeError("The provided token was not a string")
        }

        if (!this.isAuthenticated) {
            this._callerToken = token
        } else {
            throw new Error("This object is already authenticated.")
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Authenticates the class instance by querying the authentication information.
     * Optionally a user object may be provided.
     *
     * @param {User} user - optional object to avoid query
     * @throws {SwollyAuthorizationError} Thrown when the caller, identified by the token, could not be authenticated.
     * @throws {Error} Thrown when this instance is a system instance and may not be authenticated.
     * @return {Model} Returns the model instance this method was called on
     * 
     * */
    async authenticate(user) {
        if (this.isSystem)
            throw new Error("The authenticate method may only be called on non-system instances")

        const User = require("./user")

        if (user instanceof User) {
            this._caller = user
        } else {
            this._caller = await this._swolly.User._getAuth(this._callerToken)
        }

        return this
    }

    /**
     * Unauthenticates the class instance by deleting the caller information.
     * */
    async unauthenticate() {
        if (!this.isAuthenticated)
            throw new Error("The unauthenticate method may only be called on authenticated instances")

        this._caller = undefined
        return this
    }

    /**
     * Unauthenticates the class instance and deletes the callers token information.
     * */
    async makeSystem() {
        if (this.isAuthenticated)
            this.unauthenticate()

        this._callerToken = undefined
        return this
    }
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Creates and authenticates an instance of this class
     *
     * @param {Sequelize.Model} instance - The sequelize model instance to build this object from
     * @param {Swolly} swolly - The main swolly instance this instance was created under
     * @param {string} [token] - The session token these objects were queried with
     * @param {string} [caller] - The user object of the caller
     * 
     * */
    static async create(instance, swolly, token, caller) {
        return await (new this(instance, swolly, token).authenticate(caller))
    }

    ///////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Creates an object of this class for each item in the array
     *
     * @param {Sequelize.Model[]} list - The array of instances
     * @param {Swolly} swolly - The main swolly instance these instances were created under
     * @param {string} [token] The session token these objects were queried with
     * 
     * */
    static fromArray(list, swolly, token) {
        if (!Array.isArray(list)) {
            throw TypeError("The list was not an array")
        }
        return list.map(item => new this(item, swolly, token))
    }

    ///////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Creates and authenticates an instance of this class for each item in the array
     *
     * @param {Sequelize.Model[]} list - The array of instances
     * @param {Swolly} swolly - The main swolly instance these instances were created under
     * @param {string} [token] The session token these objects were queried with
     * @param {string} [caller] - The user object of the caller
     * 
     * */
    static async createFromArray(list, swolly, token, caller) {
        if (list.length == 0) {
            return []
        }

        const models = this.fromArray(list, swolly, token)
        caller = caller != null ? caller : await swolly.User._getAuth(token)

        for(const model of models) {
            await model.authenticate(caller)
        }

        return models
    }

    /// 
    /// Constructors
    /// 
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    /// 
    /// Methods
    /// 
    

    /**
     * Calls "getData" recursively on all model instances contained in this object. Also handles arrays and unresolved promises.
     *
     * @param {object} object - The object to operate on
     * @param {int} depth - The current depth
     * @param {int} maxDepth - The maximum depth
     *
     * @return {object}
     * 
     * */
    static async getDataFromObject (object, filtered = true, depth = 0, maxDepth = 3) {
        if (depth > maxDepth) {
            return object
        }

        object = await Promise.resolve(object)

        if (Array.isArray(object)) {
            return await Promise.all(object.map(async item => Model.getDataFromObject(item, filtered, depth+1)))
        }

        if (object instanceof Model) {
            return object.getData(filtered)
        }

        for (var prop in object) {
            if (object[prop] instanceof Model) {
                object[prop] = object[prop].getData()
            } else if (Array.isArray(object[prop])) {
                object[prop] = await Promise.all(object[prop].map(async item => Model.getDataFromObject(item, filterd, depth+1)))
            } else if (typeof object[prop] == "object") {
                object[prop] = await Model.getDataFromObject(object[prop], filtered, depth+1)
            }
        }

        return object
    }


    /**
     * Returns a boolean indicating if this instance belongs to the system.
     * @return {boolean}
     * 
     * */
    get isSystem () {
        return this._callerToken == null
    }

    /**
     * Returns a boolean indicating if this instance has been authenticated.
     * @return {boolean}
     * 
     * */
    get isAuthenticated () {
        return this._caller != null
    }

    /**
     * Returns a boolean indicating if this instance belongs to the system.
     *
     * @param {boolean} filtered - if the return values properties should be filtered
     *
     * */
    filterWarning (filtered) {
        if(filtered && !this.isAuthenticated) {
            console.warn(`${this.constructor.name}.getData was called with filtered=true, but this instance is unauthenticated, so filtering is not possible. Did you mean to use filtered=false?`, new Error().stack)
        }

        if(!filtered && this.isAuthenticated) {
            console.warn(`${this.constructor.name}.getData was called with filtered=false, but this instance is fully authenticated, so not filtering may cause leakage of sensitive data. Did you mean to use filtered=true?`, new Error().stack)
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
        this.filterWarning(filtered)

        return {
            id: this.getId(filtered),
            createdAt: this.getCreatedAt(filtered),
            updatedAt: this.getUpdatedAt(filtered),
        }
    }

    /// 
    /// Methods
    /// 
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    /// 
    /// Getters
    /// 

    /***
     * Returns the value of 'id'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     *
     * @return {string}
     *
     * */
    getId(filtered = this.isAuthenticated) {
        return this._id
    }


    /***
     * Returns the value of 'createdAt'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     *
     * @return {Date}
     *
     * */
    getCreatedAt(filtered = this.isAuthenticated) {
        return this._createdAt
    }


    /***
     * Returns the value of 'updatedAt'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     *
     * @return {Date}
     *
     * */
    getUpdatedAt(filtered = this.isAuthenticated) {
        return this._updatedAt
    }


    /// 
    /// Getters
    /// 
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    /// 
    /// Helpers
    /// 

    /**
     * Populates the class with the scalar value of the instance
     *
     * @param {string} name - The name of the property
     * @param {string} type - The "typeof" result the property should be checked against
     * @param {boolean} allowNull - Whether the property may be null-equivalent
     * 
     * */
    _readScalar(name, type, allowNull = false) {
        const value = this._instance[name]
        if(value == null && !allowNull)
            throw new TypeError(`instance.${name} may not be null equivalent`)

        if(value != null && typeof value !== type)
            throw new TypeError(`instance.${name} must be a ${type}`)

        return value
    }
}

module.exports = Model
