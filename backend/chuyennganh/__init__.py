from flask import Blueprint

chuyennganh_bp = Blueprint('chuyennganh', __name__)

from . import xem, quan_ly
