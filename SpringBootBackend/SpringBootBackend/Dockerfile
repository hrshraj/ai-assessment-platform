# ─── Stage 1: Build ───
# USE THIS TAG INSTEAD:
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and download dependencies (cache layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the JAR
COPY src ./src
RUN mvn clean package -DskipTests

# ─── Stage 2: Run ───
# This tag is correct for the runtime
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Copy the JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV DB_URL=jdbc:postgresql://db:5432/codeversity_db
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=password
ENV AI_SERVICE_URL=http://ai-engine:8000

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]