from flask_sqlalchemy import SQLAlchemy

# Khởi tạo đối tượng SQLAlchemy độc lập để tránh circular import giữa app và models
db = SQLAlchemy()
