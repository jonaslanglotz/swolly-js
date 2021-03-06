/**
 * Enum describing fields of {@link User} by which items may be sorted.
 */
const UserSortField = {
    ...require("./sortField"),
    FULLNAME: "fullname",
    MAIL: "mail",
    GENDER: "gender",
    ROLE: "role",
}

module.exports = UserSortField
