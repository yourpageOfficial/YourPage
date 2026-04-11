FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/api ./cmd/api/main.go
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/migrate ./cmd/migrate/main.go

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -S app && adduser -S app -G app
ENV TZ=Asia/Jakarta

COPY --from=builder /bin/api /bin/api
COPY --from=builder /bin/migrate /bin/migrate
COPY --from=builder /app/migrations /migrations

USER app
EXPOSE 8080

CMD ["/bin/api"]
