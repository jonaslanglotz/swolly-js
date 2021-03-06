/**
 * Enum describing validation error codes for validating a {@link Task}
 */
TaskValidationErrorCode = {
    TITLE_TOO_SHORT: "TITLE_TOO_SHORT",
    TITLE_NOT_STRING: "TITLE_NOT_STRING",
    STATUS_INVALID: "STATUS_INVALID",
    DESCRIPTION_NOT_STRING: "DESCRIPTION_NOT_STRING",
    SUPPORTER_GOAL_NOT_NUMBER: "SUPPORTER_GOAL_NOT_NUMBER",
    SUPPORTER_GOAL_OUT_OF_RANGE: "SUPPORTER_GOAL_OUT_OF_RANGE",
}

module.exports = TaskValidationErrorCode

