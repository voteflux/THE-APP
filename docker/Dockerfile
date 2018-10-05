FROM lambci/lambda-base:build

# Mashed python3.6 and node8.10 env together...

# let these download first so they're cached
# RUN curl https://lambci.s3.amazonaws.com/fs/python3.6.tgz > python3.6.tgz
# RUN curl https://www.python.org/ftp/python/3.6.1/Python-3.6.1.tar.xz > python3.6.1.tar.xz
# RUN curl https://lambci.s3.amazonaws.com/fs/nodejs8.10.tgz > nodejs8.10.tgz


# then set env
ENV PATH=/var/lang/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    LD_LIBRARY_PATH=/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib \
    PYTHONPATH=/var/runtime \
    PKG_CONFIG_PATH=/var/lang/lib/pkgconfig:/usr/lib64/pkgconfig:/usr/share/pkgconfig \
    AWS_EXECUTION_ENV=AWS_Lambda_nodejs8.10 \
    NODE_PATH=/var/runtime:/var/task:/var/runtime/node_modules \
    npm_config_unsafe-perm=true

# RUN curl https://rpmfind.net/linux/centos/7.5.1804/os/x86_64/Packages/gnutls-3.3.26-9.el7.x86_64.rpm > gnutls.rpm && \
# yum --nogpgcheck localinstall gnutls.rpm && rm gnutls.rpm
# RUN yum install -y gnutls

# RUN curl http://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/a/aria2-1.18.10-2.el7.1.x86_64.rpm > aria2.rpm && \
#   yum --nogpgcheck localinstall aria2.rpm && rm aria2.rpm

# main business logic
RUN rm -rf /var/runtime /var/lang && \
#   true
# RUN echo "python3.6.tgz" && \
  curl https://lambci.s3.amazonaws.com/fs/python3.6.tgz > python3.6.tgz && \
  cat python3.6.tgz | tar -xz -C / && \
  rm python3.6.tgz && \
# RUN echo "bzip2-devel" && \
  yum install -y bzip2-devel && \
  sed -i '/^prefix=/c\prefix=/var/lang' /var/lang/lib/pkgconfig/python-3.6.pc && \
#   true
# RUN echo "extract python3.6.1" && \
  curl https://www.python.org/ftp/python/3.6.1/Python-3.6.1.tar.xz > python3.6.1.tar.xz && \
  cat python3.6.1.tar.xz | tar -xJ && rm python3.6.1.tar.xz && cd Python-3.6.1 && \
#   true
# RUN echo "configure python3.6.1" && cd Python-3.6.1 && \  # keep on this line to make for easy commenting
  LIBS="$LIBS -lutil -lrt" ./configure --prefix=/var/lang && \
  echo "make python3.6.1" &&  \
  make -j$(getconf _NPROCESSORS_ONLN) libinstall libainstall inclinstall && \
  cd .. && \
  rm -rf Python-3.6.1 &&  \
#   true
# RUN echo "pip3" && \
  pip3 install -U pip awscli virtualenv pipenv --no-cache-dir && \
#   true
# RUN echo "nodejs8.10" && \
  curl https://lambci.s3.amazonaws.com/fs/nodejs8.10.tgz > nodejs8.10.tgz && \
  cat nodejs8.10.tgz | tar -zx -C / && \
  rm nodejs8.10.tgz && \
  true

RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo && yum install yarn -y
