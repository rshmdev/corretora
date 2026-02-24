package com.hydra.studios.model.activity.type;

public enum ActivityLogType {

    LOGIN,
    LOGOUT,

    UPDATE_PROFILE,
    UPDATE_PASSWORD,

    TRADE_CREATE,
    TRADE_CLOSE,
    TRADE_CASHOUT,

    UNDEFINED;

    public static ActivityLogType fromString(String type) {
        for (ActivityLogType activityLogType : ActivityLogType.values()) {
            if (activityLogType.name().equalsIgnoreCase(type)) {
                return activityLogType;
            }
        }
        return UNDEFINED;
    }
}
