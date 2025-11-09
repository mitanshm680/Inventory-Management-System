# Inventory Management System - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 22+ and npm 10+
- Git

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/mitanshm680/Inventory-Management-System.git
cd Inventory-Management-System
```

#### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Initialize database with sample data
python generate_sample_data.py

# Start the backend server
python api.py
```

The backend will be available at: `http://localhost:8001`
API documentation at: `http://localhost:8001/docs`

#### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start development server
npm start
```

The frontend will be available at: `http://localhost:3000`

### Default Login Credentials
- **Username**: admin
- **Password**: 1234

**⚠️ IMPORTANT: Change the default password immediately after first login!**

## 📦 Production Deployment

### Backend Production Setup

#### Option 1: Using Uvicorn (Recommended)
```bash
# Install production dependencies
pip install -r requirements.txt

# Run with multiple workers
uvicorn api:app --host 0.0.0.0 --port 8001 --workers 4
```

#### Option 2: Using Gunicorn + Uvicorn
```bash
pip install gunicorn

# Run with Gunicorn
gunicorn api:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### Frontend Production Build
```bash
cd frontend

# Create production build
npm run build

# Serve static files
npx serve -s build -l 3000
```

### Using Docker (Coming Soon)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔧 Configuration

### Backend Configuration (`api.py`)
```python
# JWT Settings
SECRET_KEY = "your-secret-key-here"  # Change in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# CORS Settings
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add your production URLs here
]
```

### Frontend Configuration (`frontend/src/config.ts`)
```typescript
export const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001',
    timeout: 10000
};
```

For production, create `.env` file:
```env
REACT_APP_API_URL=https://your-api-domain.com
```

## 🗄️ Database

### SQLite (Default)
- File: `inventory.db`
- No additional setup required
- Perfect for small to medium deployments

### Migration to PostgreSQL/MySQL (Optional)
1. Update database connection in `database/db_connection.py`
2. Install appropriate database driver
3. Update connection string
4. Run migrations

## 🔒 Security Best Practices

### Production Checklist
- [ ] Change default admin password
- [ ] Update SECRET_KEY in `api.py`
- [ ] Enable HTTPS for both frontend and backend
- [ ] Configure CORS to only allow production domains
- [ ] Set up rate limiting
- [ ] Enable firewall rules
- [ ] Regular database backups
- [ ] Keep dependencies updated
- [ ] Use environment variables for sensitive data
- [ ] Set up logging and monitoring

### Recommended Security Headers
```python
# Add to api.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
)
```

## 📊 Performance Optimization

### Backend
- Use multiple workers (4-8 recommended)
- Enable response caching for static data
- Add database connection pooling
- Optimize database queries with indexes (already included)

### Frontend
- Use production build (`npm run build`)
- Enable gzip compression on web server
- Use CDN for static assets
- Implement lazy loading for routes

## 🔄 Backup & Restore

### Manual Backup
```bash
# Backup database
cp inventory.db backups/inventory_$(date +%Y%m%d_%H%M%S).db

# Backup using API endpoint
curl -X POST http://localhost:8001/backup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Automated Backups (Linux/Mac)
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

Create `backup-script.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cp /path/to/inventory.db "$BACKUP_DIR/inventory_$DATE.db"
# Keep only last 30 backups
ls -t $BACKUP_DIR/inventory_*.db | tail -n +31 | xargs rm -f
```

## 🌐 Nginx Configuration (Production)

```nginx
# Backend API
upstream api_backend {
    server 127.0.0.1:8001;
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://api_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /static/ {
        root /path/to/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# SSL Configuration (recommended)
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Include rest of configuration from above
    # ...
}
```

## 📱 Environment Variables

### Backend (.env)
```env
DATABASE_URL=sqlite:///./inventory.db
SECRET_KEY=your-super-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
LOG_LEVEL=INFO
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8001
REACT_APP_ENV=production
```

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📈 Monitoring & Logging

### Backend Logs
Located in: `logs/inventory_YYYYMMDD_HHMMSS.log`

### Health Check Endpoint
```bash
curl http://localhost:8001/health
```

Response:
```json
{
  "status": "healthy",
  "message": "Inventory Management API is running"
}
```

## 🔧 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port 8001
lsof -i :8001
# Kill the process
kill -9 PID
```

**Database locked:**
```bash
# Close all connections and restart
rm inventory.db-journal
python api.py
```

**Frontend build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🎯 System Requirements

### Minimum Requirements
- **CPU**: 1 core
- **RAM**: 512 MB
- **Disk**: 1 GB
- **OS**: Linux, macOS, Windows

### Recommended for Production
- **CPU**: 2+ cores
- **RAM**: 2 GB+
- **Disk**: 10 GB+ (for logs and backups)
- **OS**: Linux (Ubuntu 20.04+ or CentOS 8+)

## 📞 Support

For issues or questions:
1. Check the documentation in `/docs` folder
2. Review FEATURES.md for feature list
3. Check API documentation at `/docs` endpoint
4. Review logs in `/logs` directory

## 🔄 Updates

To update the system:
```bash
# Pull latest changes
git pull origin main

# Backend
pip install -r requirements.txt --upgrade
python api.py

# Frontend
cd frontend
npm install
npm run build
```

## 📝 License

See LICENSE file for details.

---

**Last Updated**: November 2025
**Version**: 2.0
**Status**: Production Ready ✅
