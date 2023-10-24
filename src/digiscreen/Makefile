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
PORT = 80

###################
## MAKEFILE RULES #
###################
.PHONY: all env run clean build service compose
.DEFAULT_TARGET: build

compose: clean
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
else
ifeq ($(shell docker container inspect -f '{{.State.Status}}' $(TARGET) 2> /dev/null), running)
	@-docker stop $(TARGET) 2> /dev/null
else
	@-docker start $(TARGET) 2> /dev/null
endif
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
	@echo "🧹 Killer Clean !"
	@-docker rm -f $(TARGET) 2> /dev/null > /dev/null
endif

run: clean
ifneq ($(shell id -u), 0)
	@echo "WARNING: Switch to root ! Else docker will be a pesky bird !"
	@sudo make $@ TARGET=$(TARGET) IPHOST=$(IPHOST) IPPORT=$(IPPORT)
else
	@docker run --name $(TARGET) -it -d -p $(IPPORT):$(PORT) $(TARGET) > /dev/null
endif

env:
	@echo -n ""