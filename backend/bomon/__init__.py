from flask import Blueprint

bomon_bp = Blueprint('bomon', __name__)

from . import xem, quan_ly
