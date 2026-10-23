from flask import Blueprint

sinhvien_bp = Blueprint('sinhvien', __name__)

from . import xem, quan_ly
