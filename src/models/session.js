const Model = require('./model');
const User = require('./user');

/**
 * Class representing a single session and its properties
 * */
class Session extends Model {
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
        this._token = this._readScalar("token", "string")
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
            || this._caller.isAdmin
            || this._instance.UserId === this._caller.getId()
        ) {
            return {
                ...super.getData(filtered),
                token: this.getToken(filtered)
            }
        }
    }

    /***
     * Returns the value of 'token'
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {string}
     * */
    getToken(filtered = this.isAuthenticated) {
        if (!filtered) {
            return this._token
        }
    }

    /***
     * Returns the associated User
     *
     * @param {boolean} [filtered] - if the return values properties should be filtered to make sure the user is allowed to see them. Defaults to true if the instance is an authenticated instance, false if otherwise.
     * @return {User}
     * */
    async getUser(filtered = this.isAuthenticated) {
        return this._swolly.User.get(this._callerToken, this._instance.UserId)
    }
}

module.exports = Session
