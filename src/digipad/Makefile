#########################################
## PROJECT      : Balabox - ladigitale ##
## DATE         : 2023                 ##
## ENVIRONEMENT : Unix                 ##
## DEPENDENCIES : Docker               ##
## AUTHOR       : MONFORT Clément      ##
##                HASCOËT Anthony      ##
##                FLEJOU  MATÉO        ##
#########################################

######################
## MAKEFILE VARIABLE #
######################
MAKEFLAGS += --no-print-directory

#################
## MAKEFILE ENV #
#################
DBHOST:="127.0.0.1"
DBPORT:="6379"
DBPWD:=""

###################
## MAKEFILE RULES #
###################
.PHONY: all env run clean build service compose
.DEFAULT_TARGET: build

compose: clean env
ifneq ($(shell id -u), 0)
	@echo "WARNING: Switch to root ! Else docker will be a pesky bird !"
	@sudo make $@ TARGET=$(TARGET)
else
	@-docker compose up
endif

service:
ifneq ($(shell id -u), 0)
	@echo "WARNING: Switch to root ! Else docker will be a pesky bird !"
	@sudo make $@ TARGET=$(TARGET)
else ifeq ($(shell docker container inspect -f '{{.State.Status}}' $(TARGET) 2> /dev/null), running)
	@-docker stop $(TARGET) 2> /dev/null
else
	@-docker start $(TARGET) 2> /dev/null
endif

build: clean
ifneq ($(shell id -u), 0)
	@echo "WARNING: Switch to root ! Else docker will be a pesky bird !"
	@sudo make $@ TARGET=$(TARGET)
else
	@-docker build -t $(TARGET) . 
endif

clean:
ifneq ($(shell id -u), 0)
	@echo "WARNING: Switch to root ! Else docker will be a pesky bird !"
	@sudo make $@ TARGET=$(TARGET) IPHOST=$(IPHOST) IPPORT=$(IPPORT)
else
	@-docker rm -f $(TARGET) > /dev/null 2> /dev/null
	@-rm -f src/.env 2> /dev/null
endif

run: clean env
ifneq ($(shell id -u), 0)
	@echo "WARNING: Switch to root ! Else docker will be a pesky bird !"
	@sudo make $@ TARGET=$(TARGET) IPHOST=$(IPHOST) IPPORT=$(IPPORT)
else
	@docker run --name $(TARGET) -it -d --mount type=bind,src=$(shell pwd)/src/.env,target=/app/.env -p $(IPHOST):$(IPPORT):$(IPPORT) $(TARGET) > /dev/null
endif

env:
	@echo "🔮 \033[1m$(TARGET) .env generated\033[0m"
	@echo "DOMAIN = http://$(IPHOST):$(IPPORT)\nHOST = 0.0.0.0\nPORT = $(IPPORT)\nDB_HOST = $(DBHOST)\nDB_PWD = $(DBPWD)\nDB_PORT = $(DBPORT)\nSESSION_KEY = connect.sid\nSESSION_DURATION =" > src/.env