FROM node

MAINTAINER pdthang <pdthang@gmail.com>

RUN mkdir -p /app
WORKDIR /app

COPY ./  /app

RUN npm install --save
RUN apt-get update
RUN apt-get install -y vim 
   
RUN rm node_modules/mosca/lib/server.js
    
RUN cp server.js node_modules/mosca/lib 


EXPOSE 1883 8883 8083 8084 

CMD ["node", "mosca.js"]
