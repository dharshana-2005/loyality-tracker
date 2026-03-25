FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy only backend files properly
COPY backend/ .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

CMD ["java", "-jar", "target/*.jar"]