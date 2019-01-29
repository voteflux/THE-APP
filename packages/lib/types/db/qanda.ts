export type QandaQuestion = {
    uid: string | undefined,
    qid: string,
    author_name: string,
    question: string,
    title: string,
    ts: Date,
    is_anon: boolean,
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