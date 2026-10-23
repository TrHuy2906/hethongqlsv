from flask import Blueprint

hoidong_bp = Blueprint('hoidong', __name__)

from . import xem, quan_ly
