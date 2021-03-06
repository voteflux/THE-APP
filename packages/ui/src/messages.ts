import Vue from "vue";

export enum Messages {
    REFRESH_USER = "REFRESH_USER",
    REFRESH_AUTH = "REFRESH_AUTH",
    REFRESH_ROLES = "REFRESH_ROLES",
    GOT_USER_DETAILS = "GOT_USER_DETAILS",
    LOGOUT = "LOGOUT",

    PAGE_TITLE_UPDATE = "PAGE_TITLE_UPDATE",
}

export const M = Messages;
export const MsgBus = new Vue();
