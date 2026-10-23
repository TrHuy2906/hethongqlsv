from flask import Blueprint

lop_bp = Blueprint('lop', __name__)

from . import xem, quan_ly
