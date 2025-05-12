FROM node:18

RUN npm install -g firebase-tools

COPY . /home/genesis/app

WORKDIR /home/genesis/app

RUN npm install && npm run build

EXPOSE 8080

CMD [ "node", "./dist/index.js" ]
