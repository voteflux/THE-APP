from enum import Enum
from typing import Any
from typing import Optional
from typing import Type
from typing import TypeVar

import pynamodb.constants
from pynamodb.attributes import UnicodeAttribute, ListAttribute, NumberAttribute, MapAttribute
from adt import adt, Case

from ._typing import Attribute
from pynamodb_attributes import IntegerAttribute, TimedeltaAttribute

T = TypeVar('T', bound=Enum)
_fail: Any = object()


@adt
class _Types:
    NULL: Case
    STRING = Case["str", UnicodeAttribute]
    NUMBER = Case["num", NumberAttribute]
    INTEGER = Case["int", IntegerAttribute]
    TIME_DELTA = Case["td", TimedeltaAttribute]
    LIST_STRING = Case["strs", ListAttribute[UnicodeAttribute]]

n = _Types.NUMBER(333)
n

class DependentAttribute(Attribute[T]):
    """
    An attirbute where the type of one key (v) depends on the value of another (t).

    >>> from enum import Enum
    >>>
    >>> from pynamodb.models import Model
    """
    attr_type = pynamodb.constants.STRING

    def __init__(self, enum_type: Type[T], unknown_value: Optional[T] = _fail, **kwargs: Any) -> None:
        """
        :param enum_type: The type of the enum
        """
        super().__init__(**kwargs)
        self.enum_type = enum_type
        self.unknown_value = unknown_value
        if not all(isinstance(e.value, str) for e in self.enum_type):
            raise TypeError(f"Enumeration '{self.enum_type}' values must be all strings")

    def deserialize(self, value: str) -> Optional[T]:
        try:
            return self.enum_type(value)
        except ValueError:
            if self.unknown_value is _fail:
                raise
            return self.unknown_value

    def serialize(self, value: T) -> str:
        if not isinstance(value, self.enum_type):
            raise TypeError(f"value has invalid type '{type(value)}'; expected '{self.enum_type}'")
        return value.value
