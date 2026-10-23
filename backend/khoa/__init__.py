from flask import Blueprint

khoa_bp = Blueprint('khoa', __name__)

from . import xem, quan_ly
