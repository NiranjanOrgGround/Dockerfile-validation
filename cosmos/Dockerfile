FROM artifactory-ci.myntra.com/dockerhub/service-build-env/myntra-runner:v1

# Add labes to the image
LABEL org.opencontainers.image.title="Golang-1.20-Gradle-2.9"
LABEL org.opencontainers.image.description="Go Lang 1.20 with Gradle 2.9 Build"

# Install essential tools and packages
RUN sudo apt update -y \
    && sudo apt install -y --no-install-recommends sudo lsb-release gpg-agent software-properties-common curl jq unzip wget rsync rpm gcc build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev \
    && sudo rm -rf /var/lib/apt/lists/*

# Install Java 8
RUN sudo apt update -y \
    && sudo apt install -y openjdk-8-jdk

# Install gradle 2.9
RUN sudo wget https://services.gradle.org/distributions/gradle-2.9-bin.zip && \
    sudo unzip gradle-2.9-bin.zip && \
    sudo rm -rf gradle-2.9-bin.zip && \
    sudo mv gradle-2.9 gradle && \
    sudo ln -s /home/runner/gradle/bin/gradle /usr/local/bin/gradle

# Install Go 1.20
RUN sudo wget https://dl.google.com/go/go1.20.linux-amd64.tar.gz && \
    sudo tar -xzf go1.20.linux-amd64.tar.gz && \
    sudo chown -R runner:runner /home/runner/go

# Set environment variables
ENV HOME=/home/runner
ENV GOROOT=/home/runner/go
ENV GOPATH=$HOME/go
ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64/jre
ENV PATH=$GOPATH/bin:$GOROOT/bin:$PATH:$JAVA_HOME/bin
