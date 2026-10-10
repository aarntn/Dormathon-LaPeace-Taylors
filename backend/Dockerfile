# Build the mobile-first Vite app first. The Python service serves this output,
# so Render needs only one public service and the browser can call /api same-origin.
FROM node:22-alpine AS web-build
WORKDIR /build
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci
COPY apps/web ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend /app/backend
COPY --from=web-build /build/dist /app/web
RUN useradd --create-home buckl && chown -R buckl:buckl /app
USER buckl
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
