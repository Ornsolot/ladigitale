FROM node:lts-bullseye-slim
LABEL maintainer="Etherpad team, https://github.com/ether/etherpad-lite"

################
# Env variable #
################
ARG EP_DIR=/opt/etherpad-lite
ENV NODE_ENV=production
ARG INSTALL_SOFFICE=true
ARG EP_SHELL=
ARG EP_HOME=
ARG EP_UID=5001
ARG EP_GID=0

ARG ETHERPAD_PLUGINS= ep_align                      \
                      ep_author_hover               \
                      ep_cursortrace                \
                      ep_font_size                  \
                      ep_hash_auth                  \
                      ep_headings2                  \
                      ep_markdown                   \
                      ep_readonly_guest             \
                      ep_spellcheck                 \
                      ep_subscript_and_superscript  \
                      ep_table_of_contents          \
                      ep_set_title_on_pad

RUN groupadd --system ${EP_GID:+--gid "${EP_GID}" --non-unique} etherpad &&     \
    useradd --system ${EP_UID:+--uid "${EP_UID}" --non-unique} --gid etherpad   \
    ${EP_HOME:+--home-dir "${EP_HOME}"} --create-home                           \
    ${EP_SHELL:+--shell "${EP_SHELL}"} etherpad                                 \
    mkdir -p "${EP_DIR}" && chown etherpad:etherpad "${EP_DIR}"                 \
    export DEBIAN_FRONTEND=noninteractive;                                      \
    mkdir -p /usr/share/man/man1 &&                                             \
    apt-get -qq update -y &&                                                    \
    apt-get -qq --no-install-recommends install -y                              \
        ${INSTALL_SOFFICE:+libreoffice}                                         \
        ca-certificates curl git &&                                             \
    apt-get -qq autoremove -y &&                                                \
    apt-get -qq clean -y &&                                                     \
    rm -rf /var/lib/apt/lists/*

WORKDIR "${EP_DIR}"
COPY ./src/ ./
RUN src/bin/installDeps.sh && rm -rf ~/.npm/_cacaches                                                                       \
    [ -z "${ETHERPAD_PLUGINS}" ] || for PLUGIN_NAME in ${ETHERPAD_PLUGINS}; do npm install "${PLUGIN_NAME}" || exit 1; done

# Copy the configuration file.
COPY ./src/settings.json "${EP_DIR}"/settings.json

# Fix group permissions
RUN chmod -R g=u .
HEALTHCHECK --interval=20s --timeout=3s CMD curl -f http://localhost:3000 || exit 1

EXPOSE 9001
CMD ["node", "--experimental-worker", "src/node/server.js"]