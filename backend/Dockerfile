# Sử dụng base image nhẹ của Python
FROM python:3.9-slim

# BẢO MẬT (Hardening): Tạo user không phải root
RUN useradd -m appuser
USER appuser

# Chuyển thư mục làm việc sang thư mục của user vừa tạo
WORKDIR /home/appuser/app

# Copy file requirements và cài đặt thư viện
COPY --chown=appuser:appuser backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --user -r backend/requirements.txt

# Copy toàn bộ mã nguồn backend và frontend
COPY --chown=appuser:appuser backend/ ./backend/
COPY --chown=appuser:appuser frontend/ ./frontend/

# Đưa biến môi trường PATH để chạy được flask/gunicorn
ENV PATH="/home/appuser/.local/bin:${PATH}"
ENV PYTHONPATH="/home/appuser/app/backend:${PYTHONPATH}"

WORKDIR /home/appuser/app/backend

EXPOSE 5000

# Lệnh khởi chạy ứng dụng mặc định
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
