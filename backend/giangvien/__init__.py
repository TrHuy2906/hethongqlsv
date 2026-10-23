from flask import Blueprint

giangvien_bp = Blueprint('giangvien', __name__)

from . import xem, quan_ly
