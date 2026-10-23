from flask import Blueprint

doan_bp = Blueprint('doan', __name__)

from . import xem, quan_ly
