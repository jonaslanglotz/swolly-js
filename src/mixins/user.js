const { authFromToken } = require("../utils")

const SwollyAuthorizationError = require("../errors/authorizationError")

class UserMixin {
    constructor(swolly) {
        this.swolly = swolly
        this.store = swolly.store
    }
    
    /**
     * @param {string} [token] A authentication token for verifying authorization
     *
     * @param {object} [options] An object with options
     *
     * @param {object} [options.filter] Describes how to filter the results
     * @param {string} [options.filter.role] Filters result down to a specific role
     *
     * @param {object} [options.sort] Describes how to sort the results
     * @param {SortDirection} [options.sort.field] The field to sort by
     * @param {string} [options.sort.direction] The direction to sort in
     */
    async getUsers(token, options) {
        const auth = authFromToken(token)





    }
}

module.exports = User
