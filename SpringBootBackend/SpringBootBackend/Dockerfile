# ─── Stage 1: Build ───
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies (cache layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the JAR
COPY src ./src
RUN mvn clean package -DskipTests

# ─── Stage 2: Run ───
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Copy the JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port
EXPOSE 8080

# Environment variables (Defaults, can be overridden)
ENV PORT=8080
ENV DB_URL=jdbc:postgresql://db:5432/codeversity_db
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=password
ENV AI_SERVICE_URL=http://ai-engine:8000

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]