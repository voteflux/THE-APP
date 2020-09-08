import typing as t

from pymonad.tools import curry

T = t.TypeVar('T')
T2 = t.TypeVar('T2')


@curry
def d_get(k: str, d: t.Dict[str, T]) -> t.Optional[T]:
    return d.get(k)

@curry
def d_remove(k: str, d: t.Dict[str, T]) -> t.Dict[str, T]:
    d2 = dict(d)
    d2.pop(k)
    return d2


def mk_first_plus_initial(user):
    return ' '.join([user['fname'].title(), user['sname'][0].title()])


def mk_last_plus_initial(user):
    return ' '.join([user['fname'][0].title(), user['sname'].title()])


def mk_full_name(user):
    return ' '.join([user['fname'].title(), user['sname'].title()])


def gen_display_name(user, display_choice):
    return {
        'anon': "Anonymous",
        'first_plus_initial': mk_first_plus_initial(user),
        'last_plus_initial': mk_last_plus_initial(user),
        'full_name': mk_full_name(user)
    }[display_choice]
