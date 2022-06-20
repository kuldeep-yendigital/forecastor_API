FROM memsql/quickstart
LABEL Informa PLC Memsql Dev Server

ENV DB_PATH /var/db

# Get the latest memsql csv dump
RUN apt-get update && \
    apt-get install -y \
    wget \
    python \
    python-pip \
    unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN pip install awscli --upgrade --user
ENV PATH=~/.local/bin:${PATH}

RUN mkdir -p $DB_PATH

WORKDIR $DB_PATH
RUN mkdir -p ./schema && mkdir -p ./scripts

COPY ./schema/*.sql $DB_PATH/schema/
COPY ./scripts/*.sh $DB_PATH/scripts/

EXPOSE 3306
EXPOSE 9000