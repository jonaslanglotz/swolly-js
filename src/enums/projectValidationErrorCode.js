/**
 * Enum describing validation error codes for validating a {@link Project}
 */
ProjectValidationErrorCode = {
    TITLE_TOO_SHORT: "TITLE_TOO_SHORT",
    TITLE_NOT_STRING: "TITLE_NOT_STRING",
    DESCRIPTION_NOT_STRING: "DESCRIPTION_NOT_STRING",
    STATUS_INVALID: "STATUS_INVALID",
    MONEY_GOAL_NOT_NUMBER: "MONEY_GOAL_NOT_NUMBER",
    MONEY_GOAL_NEGATIVE: "MONEY_GOAL_NEGATIVE",
    LAT_NOT_NUMBER: "LAT_NOT_NUMBER",
    LAT_OUT_OF_RANGE: "LAT_OUT_OF_RANGE",
    LON_NOT_NUMBER: "LON_NOT_NUMBER",
    LON_OUT_OF_RANGE: "LON_OUT_OF_RANGE",
    CREATOR_INVALID: "CREATOR_INVALID",
    CATEGORY_INVALID: "CATEGORY_INVALID",
    TOO_MANY_IMAGES: "TOO_MANY_IMAGES",
}

module.exports = ProjectValidationErrorCode
