# syntax=docker/dockerfile:1

# ---------- build ----------
# Full JDK, matching the toolchain in build.gradle (Java 21).
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace

# Copy the build definition first so dependency resolution is cached in its own
# layer and is not invalidated by every source change.
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle gradle.properties ./
RUN chmod +x gradlew && ./gradlew --no-daemon --quiet dependencies

COPY src ./src
RUN ./gradlew --no-daemon clean bootJar -x test \
    && cp build/libs/*.jar /workspace/app.jar

# ---------- runtime ----------
# Debian rather than Alpine on purpose: PDFBox rasterises slides through AWT,
# which needs fontconfig and real font files to draw text. Alpine's musl JRE
# ships neither and renders blank or garbled glyphs.
FROM eclipse-temurin:21-jre-jammy AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --system --create-home --shell /usr/sbin/nologin meet2be
USER meet2be
WORKDIR /home/meet2be

COPY --from=build --chown=meet2be:meet2be /workspace/app.jar ./app.jar

# Tuned for a 512MB free-tier container: percentage-based heap so the JVM sees
# the cgroup limit, SerialGC because parallel collectors waste memory on a
# single shared vCPU, and headless AWT for PDF rendering.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -Djava.awt.headless=true -Dfile.encoding=UTF-8"

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
