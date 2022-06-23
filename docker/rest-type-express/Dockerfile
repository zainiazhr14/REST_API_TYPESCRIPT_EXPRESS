FROM node:14.18-alpine

ARG mode
ENV mode=${mode}

WORKDIR /app

COPY . .

RUN npm install

CMD [ "sh", "-c", "npm run ${mode}" ]