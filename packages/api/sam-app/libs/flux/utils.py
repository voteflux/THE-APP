import typing as t

from pymonad import curry

T = t.TypeVar('T')
T2 = t.TypeVar('T2')


@curry
def d_get(k: str, d: t.Dict[str, T]) -> T:
    return d.get(k)

@curry
def d_remove(k: str, d: t.Dict[str, T]) -> T:
    d2 = dict(d)
    d2.pop(k)
    return d2
