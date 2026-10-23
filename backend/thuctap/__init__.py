from flask import Blueprint

thuctap_bp = Blueprint('thuctap', __name__)

from . import xem, quan_ly
