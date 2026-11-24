FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/ms-admin-rabbit-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8087
ENTRYPOINT ["java", "-jar", "app.jar"]
