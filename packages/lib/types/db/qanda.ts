export type QandaQuestion = {
    isAnon: boolean
    askerName: string
}

export type QandaReply = {
    uid: string | undefined,
    qid: string,
    rid: string,
    author_name: string,
    body: string,
    ts: Date,
    parent_rid: string | undefined,
    child_rids: string[],
    is_staff: boolean,
}