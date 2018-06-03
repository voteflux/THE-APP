import Vue from "vue";

enum Messages {
    REFRESH_USER = "REFRESH_USER"
}

export const M = Messages;
export const MsgBus = new Vue();
