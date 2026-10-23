from flask import Blueprint

nienkhoa_bp = Blueprint('nienkhoa', __name__)

from . import xem, quan_ly
