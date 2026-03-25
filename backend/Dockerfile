FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy only backend files properly
COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

CMD ["java", "-jar", "target/*.jar"]