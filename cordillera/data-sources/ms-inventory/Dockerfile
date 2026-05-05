FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY mvnw mvnw
COPY .mvn/ .mvn/
RUN chmod +x mvnw

COPY pom.xml pom.xml
COPY data-sources/pom.xml data-sources/pom.xml
COPY data-sources/ms-sales/pom.xml data-sources/ms-sales/pom.xml
COPY data-sources/ms-inventory/pom.xml data-sources/ms-inventory/pom.xml
COPY data-sources/ms-finance/pom.xml data-sources/ms-finance/pom.xml
COPY data-sources/ms-customer/pom.xml data-sources/ms-customer/pom.xml
COPY core-intelligence/pom.xml core-intelligence/pom.xml
COPY core-intelligence/ms-data-ingestion/pom.xml core-intelligence/ms-data-ingestion/pom.xml
COPY core-intelligence/ms-kpis/pom.xml core-intelligence/ms-kpis/pom.xml
COPY core-intelligence/ms-reporting/pom.xml core-intelligence/ms-reporting/pom.xml
COPY infraestructure/pom.xml infraestructure/pom.xml
COPY infraestructure/eureka-server/pom.xml infraestructure/eureka-server/pom.xml
COPY infraestructure/api-gateway/pom.xml infraestructure/api-gateway/pom.xml
COPY infraestructure/bff/pom.xml infraestructure/bff/pom.xml

RUN ./mvnw dependency:go-offline -B -pl data-sources/ms-inventory -am -q

COPY data-sources/ms-inventory/src/ data-sources/ms-inventory/src/

RUN ./mvnw package -DskipTests -B -pl data-sources/ms-inventory -am -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/data-sources/ms-inventory/target/*.jar app.jar
EXPOSE 8082
ENV JAVA_OPTS="-Xmx160m -Xms64m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
