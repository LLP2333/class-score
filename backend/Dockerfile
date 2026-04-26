FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN CGO_ENABLED=1 go build -o classScore-backend .

FROM alpine:3.19 AS runner
WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/classScore-backend .
COPY --from=builder /app/config.yaml .

RUN mkdir -p /app/data/userdata

EXPOSE 8000

CMD ["./classScore-backend"]
