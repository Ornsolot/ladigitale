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
## PARSING VARIABLE ##
######################

## Name and Path of the executable/project
TRG:=ladigitale
DIR:=./src/

## Name of the file to parse for network info for each application.
INI:="$(TRG).toml"
LOG:="$(TRG).log"

##########################
## COMPILATION VARIABLE ##
##########################

## Source code folder of the target(s).
SRC:=$(filter-out GLOBAL, $(shell grep -o '\[.*\]' ${INI} | sed 's/"//g' | sed 's/\[//g' | sed 's/\]//g'))

## Rule to start or stop each container.
SVC:=$(addprefix service_, $(SRC))

## Rule to create each container via docker-compose.yml.
CMP:=$(addprefix compose_, $(SRC))

## Rule name to delete each container and image.
CLN:=$(addprefix clean_, $(SRC))

## Rule to create each environnement file.
ENV:=$(addprefix env_, $(SRC))

## Rule to create each container via docker run.
RUN:=$(addprefix run_, $(SRC))

########################
## ARGUMENTS VARIABLE ##
########################

########################################################################################################
## OBSCURE ARCANE OF BLACK WIZARDRY COMPUTER MAGIC to get the ip adresse from the initialisation file ##
########################################################################################################
ADD:=$(shell ifconfig $(shell sed -nr "/^\[GLOBAL\]/ { :l /^snetwork[ ]*=/ { s/[^=]*=[ ]*//; p; q;}; n; b l;}" ${INI}) | grep -oP '(?<=inet\s)\d+(\.\d+){3}')

## Get the network card in use.
CARD:=$(shell ip route | grep default | sed -e "s/^.*dev.//" -e "s/.proto.*//")

## Get the current local ip adresse in use.
IP:=$(shell hostname -I | cut -d ' ' -f1)

## The port before the array of free port.
PORT:=4005

#######################
## MAKEFILE VARIABLE ##
#######################
MAKEFLAGS += --no-print-directory

####################
## MAKEFILE RULES ##
####################
.PHONY: re all help clean $(SRC) $(SVC) $(BLD) $(CLN)
.DEFAULT_TARGET: re

re: purge all clean

all: $(TRG)

env: $(ENV)
	@echo "[GLOBAL]\nsnetwork=\"$(CARD)\"\nsadress=\"$(IP)\"\n" > $(INI)
	@for src in $(shell find $(DIR) -mindepth 1 -maxdepth 1 -not -empty -type d -printf '[%f]\n' | sort -k 2) ; do c=$$(( $${c:-$(PORT)}+1 )); echo "$$src\niport=$$c\n" >> $(INI); done

help:
	@clear

	@echo "📦 \033[1mDependencies :\033[0m"
	@echo "\t\e]8;;https://docs.docker.com/desktop/install/linux-install/\aDocker engine\e]8;;\a\n"
	@echo "\tBoard-App for the websocket (else the applications won't run).\n"
	@echo "\tnet-tools\n"

	@echo "🔮 \033[1mTips :\033[0m"
	@echo "\t❗ Docker is a pesky bird so the script will auto switch to root if need be !\n"
	@echo "\t❗ Both the Docker's image and container are named after the application.\n"
	@echo "\t❗ Been a Sudoer will be necessary because docker is a pesky bird.\n"

	@echo "🔮 \033[1mmake re :\033[0m"
	@echo "\tRebuild all the docker's images from scratch."
	@echo "\tThe default make target.\n"

	@echo "🔮 \033[1mmake all :\033[0m"
	@echo "\tBuild all the docker's images.\n"

	@echo "🔮 \033[1mmake env :\033[0m"
	@echo "\tCreate the Makefile's initialisation file : \033[1m$(INI)\033[0m.\n"
	@echo "\t❗ To add your own application:"
	@echo "\tYou must have a folder named after the application in \033[1m$(DIR)\033[0m.\n"
	@echo "\tWitch has the source code (app/src/), a dockerfile, docker-compose.yml and a Makefile within.\n"
	
	@echo "🔮 \033[1mmake help :\033[0m"
	@echo "\tDisplay the $(TRG) documentation (you are here).\n"

	@echo "🔮 \033[1mmake clean :\033[0m"
	@echo "\tRemove all Docker's images and containers of the application made by this Makefile.\n"

	@echo "🔮 \033[1mmake purge :\033[0m"
	@echo "\tRemove all Docker's images and containers of the application made by the Makefile.\n"
	@echo "\tRemove all Docker's images, containers and networks unused.\n"

	@echo "🔮 \033[1mmake <application> :\033[0m"
	@echo "\tReplace application by all to build all the images.\n"
	@echo "\tBuild the Docker's images of the application.\n"

	@echo "🔮 \033[1mmake run_all:\033[0m"
	@echo "\t❗ You need to create the images first !\n"
	@echo "\tBuild the Docker's containers of all the application via a docker run command.\n"

	@echo "🔮 \033[1mmake run_<application> :\033[0m"
	@echo "\t❗ You need to create the image first !\n"
	@echo "\tBuild the Docker's container of the application via a docker run command.\n"

	@echo "🔮 \033[1mmake clean_<application> :\033[0m"
	@echo "\tRemove the Docker's image and container of the application.\n"

	@echo "🔮 \033[1mmake compose_all :\033[0m"
	@echo "\t❗ You need to create the images first !\n"
	@echo "\tBuild the Docker's containers of all the application via a docker-compose.yml.\n"

	@echo "🔮 \033[1mmake compose_<application> :\033[0m"
	@echo "\t❗ You need to create the image first !\n"
	@echo "\tBuild the Docker's container of the application via a docker-compose.yml.\n"

	@echo "🔮 \033[1mmake service_<application> :\033[0m"
	@echo "\tStart and stop the Docker's container of the application.\n"

clean: $(CLN)


purge: clean
ifneq ($(shell id -u), 0)
	@echo "WARNING: Switch to root ! Else docker will be a pesky bird !"
	@sudo make $@
else
	@echo "Killer Clean third detergent.\nWipe za Dusto !"
	@-echo "y\n" | docker system prune >> 
endif

run_all: $(RUN)

compose_all: $(CMP)

############################
## MAKEFILE ABSTRACT RULE ##
############################
$(TRG): $(SRC)
	
$(SRC):
	@echo "🔮 building \033[1m$@\033[0m image"
	@-make -C ./src/$@ build TARGET=$@ IPHOST=$(ADD) IPPORT=$(PORT)

$(SVC):
	$(eval BUFFER := $(patsubst service_%,%,$@))
	@-make -C ./src/$(BUFFER) service TARGET=$(BUFFER)
	
$(CMP):
	$(eval BUFFER := $(patsubst compose_%,%,$@))
	$(eval PORT := $(shell sed -nr "/^\[$(BUFFER)\]/ { :l /^iport[ ]*=/ { s/[^=]*=[ ]*//; p; q;}; n; b l;}" ${INI}))
	@echo "🔮 \033[1m$@ on $(CARD):\033[0m http://$(ADD):$(PORT)/"
	@-make -C ./src/$(BUFFER) compose TARGET=$(BUFFER)

$(CLN):
	$(eval BUFFER := $(subst clean_,'',$@))
	@make -C ./src/$(BUFFER) clean TARGET=$(BUFFER)

$(RUN):
	$(eval BUFFER := $(patsubst run_%,%,$@))
	$(eval PORT := $(shell sed -nr "/^\[$(BUFFER)\]/ { :l /^iport[ ]*=/ { s/[^=]*=[ ]*//; p; q;}; n; b l;}" ${INI}))	
	@echo "🔮 \033[1m$(BUFFER) on $(CARD):\033[0m http://$(ADD):$(PORT)/"
	@-make -C ./src/$(BUFFER) run TARGET=$(BUFFER) IPHOST=$(ADD) IPPORT=$(PORT)

$(ENV):
	$(eval BUFFER := $(patsubst env_%,%,$@))
	@-make -C ./src/$(BUFFER) env TARGET=$(BUFFER) IPHOST=$(ADD) IPPORT=$(PORT) 2> /dev/null