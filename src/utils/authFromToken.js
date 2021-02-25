async function authFromToken(token) {
    if (typeof token !== "string") {
        throw SwollyAuthorizationError("The provided token was not a string.")
    }

    const session = await this.store.Session.findByPk(token, {
        include: {
            model: store.User,
            as: "user"
        }
    })

    if (typeof session == null || typeof session.user == null) {
        throw SwollyAuthorizationError("The provided token was invalid.")
    }

    return user
}

module.exports = authFromToken
