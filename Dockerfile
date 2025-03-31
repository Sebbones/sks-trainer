FROM node:latest AS build-node

WORKDIR /app
COPY ./frontend .
RUN yarn install
RUN yarn vite build --mode=production

FROM golang AS build-go

WORKDIR /app

COPY ./server/go.mod ./server/go.sum ./
RUN go mod download

COPY ./server .
COPY --from=build-node /app/dist ./public/

RUN CGO_ENABLED=1 GOOS=linux go build -o ./sks

EXPOSE 1323

ENTRYPOINT [ "/app/sks" ]
