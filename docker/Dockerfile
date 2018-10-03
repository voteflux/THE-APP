FROM lambci/lambda-base:build

# Mashed python3.6 and node8.10 env together...


# let these download first so they're cached
RUN curl https://lambci.s3.amazonaws.com/fs/python3.6.tgz > python3.6.tgz
RUN curl https://www.python.org/ftp/python/3.6.1/Python-3.6.1.tar.xz > python3.6.1.tar.xz
RUN curl https://lambci.s3.amazonaws.com/fs/nodejs8.10.tgz > nodejs8.10.tgz


# then set env
ENV PATH=/var/lang/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    LD_LIBRARY_PATH=/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib \
    PYTHONPATH=/var/runtime \
    PKG_CONFIG_PATH=/var/lang/lib/pkgconfig:/usr/lib64/pkgconfig:/usr/share/pkgconfig \
    AWS_EXECUTION_ENV=AWS_Lambda_nodejs8.10 \
    NODE_PATH=/var/runtime:/var/task:/var/runtime/node_modules \
    npm_config_unsafe-perm=true


# main business logic
RUN rm -rf /var/runtime /var/lang
RUN echo "python3.6.tgz" && \
  cat python3.6.tgz | tar -xz -C /
RUN echo "bzip2-devel" && \
  yum install -y bzip2-devel && \
  sed -i '/^prefix=/c\prefix=/var/lang' /var/lang/lib/pkgconfig/python-3.6.pc
RUN echo "configure python3.6.1" && \
  cat python3.6.1.tar.xz | tar -xJ && \
  cd Python-3.6.1 && \
  LIBS="$LIBS -lutil -lrt" ./configure --prefix=/var/lang && \
  echo "make python3.6.1" &&  \
  make -j$(getconf _NPROCESSORS_ONLN) libinstall libainstall inclinstall && \
  cd .. && \
  rm -rf Python-3.6.1
RUN echo "pip3" && \
  pip3 install -U pip awscli virtualenv pipenv --no-cache-dir
RUN echo "nodejs8.10" && \
  cat nodejs8.10.tgz | tar -zx -C /
