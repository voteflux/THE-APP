// exports a list of collections in db-v1 so that we can make
// our db object a bit nicer (i.e. by setting db.users = client.collection('users'))

module.exports = [
    "db_meta",
    "users",
    "public_stats",
]
