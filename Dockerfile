FROM quay.io/apibara/sink-postgres:0.7.0-x86_64

WORKDIR /app
COPY ./* /app

ENTRYPOINT ["/nix/store/rh1g8pb7wfnyr527jfmkkc5lm3sa1f0l-apibara-sink-postgres-0.7.0/bin/apibara-sink-postgres"]