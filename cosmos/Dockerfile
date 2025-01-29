FROM artifactory-ci.myntra.com/dockerhub/service-build-env/myntra-runner:latest

# Add labes to the image
LABEL org.opencontainers.image.title="Golang-1.20-Gradle-2.9"
LABEL org.opencontainers.image.description="Go Lang 1.20 with Gradle 2.9 Build"

# Install essential tools and packages
RUN sudo apt update -y \
    && sudo apt install -y --no-install-recommends sudo lsb-release gpg-agent software-properties-common curl jq unzip wget rsync rpm gcc build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev \
    && sudo rm -rf /var/lib/apt/lists/*

# Install Java 21
RUN wget https://download.oracle.com/java/23/latest/jdk-21_linux-aarch64_bin.tar.gz

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

# Install Node 14.15.4
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash \
    && export NVM_DIR="$HOME/.nvm" \
    && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" \
    && nvm install v14.15.4 \
    && npm install --global yarn \
    && sudo ln -s $HOME/.nvm/versions/node/v14.15.4/bin/node /usr/local/bin/node \
    && sudo ln -s $HOME/.nvm/versions/node/v14.15.4/bin/npm /usr/local/bin/npm \
    && sudo ln -s $HOME/.nvm/versions/node/v14.15.4/bin/npx /usr/local/bin/npx \
    && sudo ln -s $HOME/.nvm/versions/node/v14.15.4/bin/yarn /usr/local/bin/yarn \
    && sudo chown -R runner:runner /usr/local/bin

# Install maven 3.3.3
RUN sudo wget https://archive.apache.org/dist/maven/maven-3/3.3.3/binaries/apache-maven-3.3.3-bin.tar.gz \
    && sudo tar -xvzf apache-maven-3.3.3-bin.tar.gz \
    && sudo mv apache-maven-3.3.3 /opt/maven \
    && sudo rm -rf apache-maven-3.3.3-bin.tar.gz \
    && sudo chown -R runner:runner /opt/maven

#Installing Python 3.9
RUN cd /opt \
    && sudo wget --no-check-certificate https://www.python.org/ftp/python/3.9.0/Python-3.9.0.tar.xz \
    && sudo tar xf Python-3.9.0.tar.xz \
    && cd Python-3.9.0 \
    && sudo ./configure --prefix=/usr/local \
    && sudo make && sudo make altinstall

# Set environment variables
ENV HOME=/home/runner
ENV GOROOT=/home/runner/go
ENV GOPATH=$HOME/go
ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64/jre
ENV PATH=$GOPATH/bin:$GOROOT/bin:$PATH:$JAVA_HOME/bin
