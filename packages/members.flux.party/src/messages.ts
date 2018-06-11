import Vue from "vue";

enum Messages {
    REFRESH_USER = "REFRESH_USER",
    GOT_USER_DETAILS = "GOT_USER_DETAILS",
    LOGOUT = "LOGOUT",
}

export const M = Messages;
export const MsgBus = new Vue();
