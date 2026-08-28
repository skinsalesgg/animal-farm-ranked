FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache tini wget

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN chmod +x docker/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./docker/entrypoint.sh"]
