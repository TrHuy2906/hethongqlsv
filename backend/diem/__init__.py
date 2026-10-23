from flask import Blueprint

diem_bp = Blueprint('diem', __name__)

from . import xem, quan_ly
