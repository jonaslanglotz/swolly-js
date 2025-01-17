/**
 * Enum describing validation error codes for validationg a {@link User}
 */
UserValidationErrorCode = {
    PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
    PASSWORD_NOT_STRING: "PASSWORD_NOT_STRING",
    FULLNAME_TOO_SHORT: "FULLNAME_TOO_SHORT",
    FULLNAME_NOT_STRING: "FULLNAME_NOT_STRING",
    MAIL_TOO_SHORT: "MAIL_TOO_SHORT",
    MAIL_NOT_STRING: "MAIL_NOT_STRING",
    MAIL_ALREADY_USED: "MAIL_ALREADY_USED",
    ROLE_INVALID: "ROLE_INVALID",
    GENDER_INVALID: "GENDER_INVALID"
}

module.exports = UserValidationErrorCode
