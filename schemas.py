"""
Redirect file - all schemas live in api/schemas.py
This file exists so that `from schemas import X` still works.
"""
from api.schemas import *  # noqa: F401,F403
