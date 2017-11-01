FROM bitnami/node:8.9.0-r0 as builder

# Create app directory
RUN mkdir -p /app/image-resizer
WORKDIR /app/image-resizer

RUN npm install -g tripviss/image-resizer --unsafe
RUN image-resizer new
RUN npm install --unsafe

FROM bitnami/node:8.9.0-r0-prod
RUN mkdir -p /app/image-resizer
WORKDIR /app/image-resizer
RUN npm install --global pm2 --unsafe
COPY --from=builder /app/image-resizer .
EXPOSE 3000

CMD ["node", "server.js"]