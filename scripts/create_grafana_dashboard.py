import urllib.request
import json
import base64

auth = base64.b64encode(b'admin:admin').decode()

dashboard = {
    "dashboard": {
        "id": None,
        "title": "Hệ thống Quản lý Sinh viên - Giám sát Tổng thể",
        "tags": ["hethongqlsv", "production", "monitoring"],
        "timezone": "browser",
        "schemaVersion": 30,
        "version": 1,
        "refresh": "5s",
        "panels": [
            {
                "id": 1,
                "title": "Trạng thái Web App (Flask)",
                "type": "stat",
                "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0},
                "targets": [
                    {
                        "datasource": {"type": "prometheus", "uid": "eg20eqyzviq68a"},
                        "expr": 'up{job="flask_app"}'
                    }
                ],
                "fieldConfig": {
                    "defaults": {
                        "mappings": [
                            {
                                "type": "value",
                                "options": {
                                    "1": {"text": "ONLINE", "color": "green"},
                                    "0": {"text": "OFFLINE", "color": "red"}
                                }
                            }
                        ]
                    }
                }
            },
            {
                "id": 2,
                "title": "Trạng thái Prometheus Scrape",
                "type": "stat",
                "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0},
                "targets": [
                    {
                        "datasource": {"type": "prometheus", "uid": "eg20eqyzviq68a"},
                        "expr": 'up{job="prometheus"}'
                    }
                ],
                "fieldConfig": {
                    "defaults": {
                        "mappings": [
                            {
                                "type": "value",
                                "options": {
                                    "1": {"text": "HEALTHY", "color": "green"},
                                    "0": {"text": "DOWN", "color": "red"}
                                }
                            }
                        ]
                    }
                }
            },
            {
                "id": 3,
                "title": "Tổng số Request đã phục vụ",
                "type": "stat",
                "gridPos": {"h": 4, "w": 12, "x": 12, "y": 0},
                "targets": [
                    {
                        "datasource": {"type": "prometheus", "uid": "eg20eqyzviq68a"},
                        "expr": "sum(flask_http_request_total)"
                    }
                ]
            },
            {
                "id": 4,
                "title": "Phân bố Request theo HTTP Status Code",
                "type": "timeseries",
                "gridPos": {"h": 8, "w": 12, "x": 0, "y": 4},
                "targets": [
                    {
                        "datasource": {"type": "prometheus", "uid": "eg20eqyzviq68a"},
                        "expr": "sum(flask_http_request_total) by (status)",
                        "legendFormat": "HTTP {{status}}"
                    }
                ]
            },
            {
                "id": 5,
                "title": "Tần suất Request theo Endpoint",
                "type": "timeseries",
                "gridPos": {"h": 8, "w": 12, "x": 12, "y": 4},
                "targets": [
                    {
                        "datasource": {"type": "prometheus", "uid": "eg20eqyzviq68a"},
                        "expr": "topk(6, sum(rate(flask_http_request_total[1m])) by (endpoint))",
                        "legendFormat": "Route: {{endpoint}}"
                    }
                ]
            },
            {
                "id": 6,
                "title": "Nhật ký Log Container Trực tiếp (Loki)",
                "type": "logs",
                "gridPos": {"h": 10, "w": 24, "x": 0, "y": 12},
                "targets": [
                    {
                        "datasource": {"type": "loki", "uid": "ag20eqz9nmewwf"},
                        "expr": '{container=~"hethongqlsv_.*"}'
                    }
                ]
            }
        ]
    },
    "overwrite": True
}

req = urllib.request.Request(
    "http://localhost:3002/api/dashboards/db",
    data=json.dumps(dashboard).encode("utf-8"),
    headers={
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/json"
    }
)
res = urllib.request.urlopen(req)
print("Dashboard created successfully:", res.read().decode())
