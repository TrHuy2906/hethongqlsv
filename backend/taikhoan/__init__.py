from flask import Blueprint

taikhoan_bp = Blueprint('taikhoan', __name__)

from . import xem, quan_ly
