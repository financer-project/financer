FROM node:22-alpine AS build

# Enable Corepack for Yarn 4
RUN corepack enable

WORKDIR /app

COPY package.json yarn.lock* .yarnrc.yml ./
RUN yarn install --immutable || yarn install

COPY . .
RUN yarn build

FROM nginx:alpine AS production

COPY --from=build /app/.vitepress/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
