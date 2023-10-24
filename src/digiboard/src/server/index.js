require('dotenv').config()
const http = require('http')
const path = require('path')
const fs = require('fs-extra')
const { Nuxt, Builder } = require('nuxt')
const express = require('express')
const app = express()
const server = http.createServer(app)
const cors = require('cors')
const io = require('socket.io')(server, { cookie: false , allowEIO3: true });
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const WebSocket = require('ws');
try{

const ws = new WebSocket("ws://board-app:50001")



let db
let db_port = 6379
let ipUtilisateurs = new Map(); 
if (process.env.DB_PORT) {
	db_port = process.env.DB_PORT
}
if (process.env.NODE_ENV === 'production') {
	db = redis.createClient({ host: process.env.DB_HOST, port: db_port, password: process.env.DB_PWD })
} else {
	db = redis.createClient({ port: db_port })
}
const bodyParser = require('body-parser')
const helmet = require('helmet')
const v = require('voca')
const multer = require('multer')
const sharp = require('sharp')
const archiver = require('archiver')
const extract = require('extract-zip')
const moment = require('moment')
const bcrypt = require('bcrypt')
const cron = require('node-cron')
let storeOptions, cookie, dureeSession, domainesAutorises
if (process.env.NODE_ENV === 'production') {
	storeOptions = {
		host: process.env.DB_HOST,
		port: db_port,
		pass: process.env.DB_PWD,
		client: db,
		prefix: 'sessions:'
	}
	cookie = {
		//sameSite: 'None',
		secure: false
	}
} else {
	storeOptions = {
		host: 'localhost',
		port: db_port,
		client: db,
		prefix: 'sessions:'
	}
	cookie = {
		secure: false
	}
}
const sessionOptions = {
	secret: process.env.SESSION_KEY,
	store: new RedisStore(storeOptions),
	name: 'digiboard',
	resave: false,
	rolling: true,
	saveUninitialized: false,
	saveUninitialized: false,
	cookie: cookie
}
if (process.env.SESSION_DURATION) {
	dureeSession = parseInt(process.env.SESSION_DURATION)
} else {
	dureeSession = 864000000 //3600 * 24 * 10 * 1000
}
if (process.env.NODE_ENV === 'production' && process.env.AUTORIZED_DOMAINS) {
	domainesAutorises = process.env.AUTORIZED_DOMAINS.split(',')
} else {
	domainesAutorises = '*'
}
const expressSession = session(sessionOptions)
const sharedsession = require('express-socket.io-session')
const config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')
const nuxt = new Nuxt(config)
const { host, port } = nuxt.options.server

if (config.dev) {
	process.env.DEBUG = 'nuxt:*'
	const builder = new Builder(nuxt)
	builder.build()
} else {
	nuxt.ready()
}

cron.schedule('59 23 * * Saturday', () => {
	fs.emptyDirSync(path.join(__dirname, '..', '/static/temp'))
})

app.set('trust proxy', true)
app.use(helmet({ frameguard: false }))
app.use(bodyParser.json({ limit: '10mb' }))
app.use(expressSession)
io.use(sharedsession(expressSession, {
	autoSave: true
}))
app.use(cors({ 'credentials': true , 'origin': domainesAutorises  }))



async function envoiejson(){
	
    setInterval(() => {
        let data = []
        ipUtilisateurs.forEach(function(value, key) {
            data.push({id:value, name:key})
        });
        ws.addEventListener("open", () => {
			//console.log("Enjoy") //when the connection is opened
            ws.send(JSON.stringify({ //send a JSON through websocket that contains a list of students and the app they're in
                type:"type_eleve",
                name:"digiboard",
                data:data
            },
            {
                type:"integration",
                name:"digiboard",
                logo:"https://pouet.chapril.org/system/accounts/avatars/000/096/847/original/841401129f94028b.png",
            }
            ));
	
        });
		
    }, 10000);
}

envoiejson()

app.get('/b/:tableau', function (req) {
	if (req.session.identifiant === '' || req.session.identifiant === undefined) {
		const identifiant = 'u' + Math.random().toString(16).slice(3)
		req.session.identifiant = identifiant
		req.session.nom = choisirNom() + ' ' + choisirAdjectif()
		req.session.langue = 'fr'
		req.session.statut = 'participant'
		req.session.tableaux = []
		req.session.cookie.expires = new Date(Date.now() + dureeSession)
		ipUtilisateurs.set(identifiant, req.ip)
	}
	req.next()
})




app.post('/api/creer-tableau', function (req, res) {
	if (req.session.identifiant === '' || req.session.identifiant === undefined) {
		const identifiant = 'u' + Math.random().toString(16).slice(3)
		req.session.identifiant = identifiant
		req.session.tableaux = []
	}
	const titre = req.body.titre
	const question = req.body.question
	const reponse = req.body.reponse
	const hash = bcrypt.hashSync(reponse, 10)
	const tableau = Math.random().toString(16).slice(2)
	const date = moment().format()
	db.exists('tableaux:' + tableau, function (err, resultat) {
		if (err) { res.send('erreur') }
		if (resultat === 0) {
			const donnees = []
			donnees[0] = []
			const options = {}
			options.fond = '#ffffff'
			options.edition = 'ouverte'
			db.hmset('tableaux:' + tableau, 'titre', titre, 'question', question, 'reponse', hash, 'donnees', JSON.stringify(donnees), 'options', JSON.stringify(options), 'date', date, function (err) {
				if (err) { res.send('erreur'); return false }
				const chemin = path.join(__dirname, '..', '/static/fichiers/' + tableau)
				fs.mkdirsSync(chemin)
				if (req.session.nom === '' || req.session.nom === undefined) {
					req.session.nom = choisirNom() + ' ' + choisirAdjectif()
				}
				if (req.session.langue === '' || req.session.langue === undefined) {
					req.session.langue = 'fr'
				}
				req.session.statut = 'auteur'
				req.session.tableaux.push(tableau)
				req.session.cookie.expires = new Date(Date.now() + dureeSession)
				res.send(tableau)
			})
		} else {
			res.send('existe_deja')
		}
	})
})

app.post('/api/recuperer-donnees-tableau', function (req, res) {
	const tableau = req.body.tableau
	db.exists('tableaux:' + tableau, function (err, reponse) {
		if (err) { res.send('erreur'); return false }
		if (reponse === 1) {
			db.hgetall('tableaux:' + tableau, function (err, resultat) {
				if (err) { res.send('erreur'); return false }
				if (resultat.hasOwnProperty('statut') === true) {
					const titre = resultat.titre
					const statut = resultat.statut
					const donnees = JSON.parse(resultat.donnees)
					const options = JSON.parse(resultat.options)
					res.json({ titre: titre, statut: statut, donnees: donnees, options: options })
					db.hdel('tableaux:' + tableau, 'statut')
				} else {
					const titre = resultat.titre
					const donnees = JSON.parse(resultat.donnees)
					const options = JSON.parse(resultat.options)
					res.json({ titre: titre, donnees: donnees, options: options })
				}
			})
		} else {
			res.send('erreur')
		}
	})
})

app.post('/api/debloquer-tableau', function (req, res) {
	const tableau = req.body.tableau
	const question = req.body.question
	const reponse = req.body.reponse
	db.hgetall('tableaux:' + tableau, function (err, resultat) {
		if (err) { res.send('erreur'); return false }
		if (resultat.question === question && bcrypt.compareSync(reponse, resultat.reponse)) {
			req.session.statut = 'auteur'
			req.session.tableaux = []
			req.session.tableaux.push(tableau)
			res.send('tableau_debloque')
		} else {
			res.send('informations_incorrectes')
		}
	})
})

app.post('/api/modifier-titre', function (req, res) {
	const tableau = req.body.tableau
	if (req.session.statut === 'auteur' && req.session.tableaux.includes(tableau)) {
		const titre = req.body.nouveautitre
		db.exists('tableaux:' + tableau, function (err, resultat) {
			if (err) { res.send('erreur'); return false }
			if (resultat === 1) {
				db.hset('tableaux:' + tableau, 'titre', titre, function (err) {
					if (err) { res.send('erreur'); return false }
					res.send('titre_modifie')
				})
			} else {
				res.send('erreur')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/modifier-acces', function (req, res) {
	const tableau = req.body.tableau
	if (req.session.statut === 'auteur' && req.session.tableaux.includes(tableau)) {
		const question = req.body.question
		const reponse = req.body.reponse
		db.exists('tableaux:' + tableau, function (err, rep) {
			if (err) { res.send('erreur'); return false }
			if (rep === 1) {
				db.hgetall('tableaux:' + tableau, function (err, resultat) {
					if (err) { res.send('erreur'); return false }
					if (resultat.question === question && bcrypt.compareSync(reponse, resultat.reponse)) {
						const nouvellequestion = req.body.nouvellequestion
						const nouvellereponse = req.body.nouvellereponse
						const hash = bcrypt.hashSync(nouvellereponse, 10)
						db.hmset('tableaux:' + tableau, 'question', nouvellequestion, 'reponse', hash, function (err) {
							if (err) { res.send('erreur'); return false }
							res.send('acces_modifie')
						})
					} else {
						res.send('informations_incorrectes')
					}
				})
			} else {
				res.send('erreur')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/modifier-fond', function (req, res) {
	const tableau = req.body.tableau
	if (req.session.statut === 'auteur' && req.session.tableaux.includes(tableau)) {
		const fond = req.body.fond
		db.exists('tableaux:' + tableau, function (err, resultat) {
			if (err) { res.send('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('tableaux:' + tableau, function (err, reponse) {
					if (err) { res.send('erreur'); return false }
					const options = JSON.parse(reponse.options)
					options.fond = fond
					db.hset('tableaux:' + tableau, 'options', JSON.stringify(options), function (err) {
						if (err) { res.send('erreur'); return false }
						res.send('fond_modifie')
					})
				})
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/exporter-tableau', function (req, res) {
	const tableau = req.body.tableau
	if (req.session.statut === 'auteur' && req.session.tableaux.includes(tableau)) {
		const items = req.body.items
		const chemin = path.join(__dirname, '..', '/static/temp')
		fs.mkdirpSync(path.normalize(chemin + '/' + tableau))
		fs.mkdirpSync(path.normalize(chemin + '/' + tableau + '/fichiers'))
		fs.writeFileSync(path.normalize(chemin + '/' + tableau + '/donnees.json'), JSON.stringify({ items: items }, '', 4), 'utf8')
		for (let i = 0; i < items.length; i++) {
			for (let j = 0; j < items[i].length; j++) {
				if (Object.keys(items[i][j]).length > 0 && items[i][j].objet === 'image' && items[i][j].fichier !== '' && fs.existsSync(path.join(__dirname, '..', '/static/fichiers/' + tableau + '/' + items[i][j].fichier))) {
					fs.copySync(path.join(__dirname, '..', '/static/fichiers/' + tableau + '/' + items[i][j].fichier), path.normalize(chemin + '/' + tableau + '/fichiers/' + items[i][j].fichier, { overwrite: true }))
				}
			}
		}
		const archiveId = Math.floor((Math.random() * 100000) + 1)
		const sortie = fs.createWriteStream(path.normalize(chemin + '/tableau-' + tableau + '_' + archiveId + '.zip'))
		const archive = archiver('zip', {
			zlib: { level: 9 }
		})
		sortie.on('finish', function () {
			fs.removeSync(path.normalize(chemin + '/' + tableau))
			res.send('tableau-' + tableau + '_' + archiveId + '.zip')
		})
		archive.pipe(sortie)
		archive.directory(path.normalize(chemin + '/' + tableau), false)
		archive.finalize()
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/importer-tableau', function (req, res) {
	televerserArchive(req, res, async function (err) {
		if (err) { res.send('erreur_import'); return false }
		try {
			const tableau = req.body.tableau
			if (req.session.statut === 'auteur' && req.session.tableaux.includes(tableau)) {
				const chemin = path.join(__dirname, '..', '/static/fichiers/' + tableau)
				fs.emptyDirSync(chemin)
				const source = path.join(__dirname, '..', '/static/temp/' + req.file.filename)
				const cible = path.join(__dirname, '..', '/static/temp/archive-' + Math.floor((Math.random() * 100000) + 1))
				await extract(source, { dir: cible })
				const donnees = await fs.readJson(path.normalize(cible + '/donnees.json'))
				const items = donnees.items
				for (let i = 0; i < items.length; i++) {
					for (let j = 0; j < items[i].length; j++) {
						if (items[i][j].objet === 'image' && items[i][j].fichier !== '' && fs.existsSync(path.normalize(cible + '/fichiers/' + items[i][j].fichier))) {
							fs.copySync(path.normalize(cible + '/fichiers/' + items[i][j].fichier), path.normalize(chemin + '/' + items[i][j].fichier, { overwrite: true }))
						}
					}
				}
				db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(items), function (err) {
					if (err) { res.send('erreur_import'); return false }
					fs.removeSync(source)
					fs.removeSync(cible)
					res.json({ items: items })
				})
			} else {
				res.send('non_autorise')
			}
		} catch (err) {
			fs.removeSync(path.join(__dirname, '..', '/static/temp/' + req.file.filename))
			res.send('erreur_import')
		}
	})
})

app.post('/api/supprimer-tableau', function (req, res) {
	const tableau = req.body.tableau
	if (req.session.statut === 'auteur' && req.session.tableaux.includes(tableau)) {
		db.exists('tableaux:' + tableau, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				db.del('tableaux:' + tableau, function (err) {
					if (err) { res.send('erreur'); return false }
					const chemin = path.join(__dirname, '..', '/static/fichiers/' + tableau)
					fs.removeSync(chemin)
					res.send('tableau_supprime')
				})
			} else {
				res.send('erreur')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/terminer-session', function (req, res) {
	req.session.statut = 'participant'
	req.session.tableaux = []
	res.send('session_terminee')
})

app.post('/api/modifier-nom', function (req, res) {
	const nom = req.body.nom
	req.session.nom = nom
	res.send('nom_modifie')
})

app.post('/api/modifier-langue', function (req, res) {
	if (req.session.identifiant === '' || req.session.identifiant === undefined) {
		const identifiant = 'u' + Math.random().toString(16).slice(3)
		req.session.identifiant = identifiant
		req.session.tableaux = []
	}
	const langue = req.body.langue
	req.session.langue = langue
	res.send('langue_modifiee')
})

app.post('/api/televerser-image', function (req, res) {
	televerser(req, res, function (err) {
		if (err) { res.send('erreur_televersement'); return false }
		const fichier = req.file
		const tableau = req.body.tableau
		let mimetype = fichier.mimetype
		const chemin = path.join(__dirname, '..', '/static/fichiers/' + tableau + '/' + fichier.filename)
		if (mimetype.split('/')[0] === 'image') {
			const extension = path.parse(fichier.filename).ext
			if (extension.toLowerCase() === '.jpg' || extension.toLowerCase() === '.jpeg') {
				sharp(chemin).withMetadata().rotate().jpeg().resize(1500, 1500, {
					fit: sharp.fit.inside,
					withoutEnlargement: true
				}).toBuffer((err, buffer) => {
					if (err) { res.send('erreur_televersement'); return false }
					fs.writeFile(chemin, buffer, function() {
						res.send(fichier.filename)
					})
				})
			} else {
				sharp(chemin).withMetadata().resize(1500, 1500, {
					fit: sharp.fit.inside,
					withoutEnlargement: true
				}).toBuffer((err, buffer) => {
					if (err) { res.send('erreur_televersement'); return false }
					fs.writeFile(chemin, buffer, function() {
						res.send(fichier.filename)
					})
				})
			}
		} else {
			res.send('erreur_type_fichier')
		}
	})
})

app.post('/api/copier-image', function (req, res) {
	const image = req.body.image
	const tableau = req.body.tableau
	const info = path.parse(image)
	const extension = info.ext.toLowerCase()
	let nom = v.latinise(info.name.toLowerCase())
	nom = nom.replace(/\ /gi, '-')
	nom = nom.replace(/[^0-9a-z_\-]/gi, '')
	if (nom.length > 100) {
		nom = nom.substring(0, 100)
	}
	nom = nom + '_' + Math.random().toString(36).substring(2) + extension
	const chemin = path.join(__dirname, '..', '/static/fichiers/' + tableau + '/' + image)
	const destination = path.join(__dirname, '..', '/static/fichiers/' + tableau + '/' + nom)
	fs.copy(chemin, destination, { overwrite: false, errorOnExist: false }, function (err) {
		if (err) { res.send('erreur'); return false }
		res.send(nom)
	})
})

app.use(nuxt.render)

server.listen(port, host)

io.on('connection', function (socket) {
	socket.on('connexion', async function (donnees) {
		console.log("Requete");
		const tableau = donnees.tableau
		const identifiant = donnees.identifiant
		const nom = donnees.nom
		const statut = donnees.statut
		const room = 'tableau-' + tableau
		socket.join(room)
		socket.identifiant = identifiant
		socket.nom = nom
		socket.statut = statut
		const clients = await io.in(room).fetchSockets()
		const utilisateurs = []
		for (let i = 0; i < clients.length; i++) {
			utilisateurs.push({ identifiant: clients[i].identifiant, nom: clients[i].nom, statut: clients[i].statut })
		}
		io.in(room).emit('connexion', utilisateurs)
		console.log("Fin");
	})

	socket.on('deconnexion', function (tableau) {
		ipUtilisateurs.delete(socket.handshake.session.identifiant)
		socket.to(tableau).emit('deconnexion', socket.handshake.session.identifiant)
	})

	socket.on('ajouter', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const items = donnees.items
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].push(...items)
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau ), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('ajouter', { page: page, items: items })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('reajouter', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const items = donnees.items
			const index = donnees.index
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].splice(...[index, 0].concat(items))
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau ), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('reajouter', { page: page, items: items, index: index })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('verrouiller', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const noms = donnees.noms
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						noms.forEach(function (nom) {
							donneesTableau[page].forEach(function (item) {
								if (item.name === nom) {
									item.draggable = false
									item.verrouille = true
								}
							})
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('verrouiller', { page: page, noms: noms })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('deverrouiller', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const noms = donnees.noms
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						noms.forEach(function (nom) {
							donneesTableau[page].forEach(function (item) {
								if (item.name === nom) {
									item.draggable = true
									item.verrouille = false
								}
							})
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('deverrouiller', { page: page, noms: noms })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('modifierposition', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const nom = donnees.nom
			const indexItem = donnees.index
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].forEach(function (item, index) {
							if (item.name === nom) {
								donneesTableau[page].splice(index, 1)
								donneesTableau[page].splice(indexItem, 0, item)
							}
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('modifierposition', { page: page, nom: nom, index: indexItem })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('deplacer', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const items = donnees.items
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						items.forEach(function (obj) {
							donneesTableau[page].forEach(function (item) {
								if (item.name === obj.nom) {
									item.x = obj.x
									item.y = obj.y
									if (obj.hasOwnProperty('points')) {
										item.points = obj.points
									}
								}
							})
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('deplacer', { page: page, items: items })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('redimensionner', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].forEach(function (item) {
							if (item.name === donnees.item.name) {
								item.x = donnees.item.x
								item.y = donnees.item.y
								item.width = donnees.item.width
								item.height = donnees.item.height
								item.scaleX = donnees.item.scaleX
								item.scaleY = donnees.item.scaleY
							}
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('redimensionner', { page: page, item: donnees.item })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('modifiertexte', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const nom = donnees.nom
			const texte = donnees.texte
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].forEach(function (item) {
							if (item.name === nom && item.objet === 'texte') {
								item.text = texte
							} else if (item.name === nom && item.objet !== 'texte') {
								item.text.text = texte
							}
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('modifiertexte', { page: page, nom: nom, texte: texte })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('modifiertailletexte', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const nom = donnees.nom
			const taille = donnees.taille
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].forEach(function (item) {
							if (item.name === nom) {
								item.fontSize = taille
							}
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('modifiertailletexte', { page: page, nom: nom, taille: taille })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('modifieralignementtexte', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const nom = donnees.nom
			const alignement = donnees.alignement
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].forEach(function (item) {
							if (item.name === nom) {
								item.align = alignement
							}
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('modifieralignementtexte', { page: page, nom: nom, alignement: alignement })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('modifierfiltre', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const nom = donnees.nom
			const filtre = donnees.filtre
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].forEach(function (item) {
							if (item.name === nom) {
								item.filtre = filtre
							}
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('modifierfiltre', { page: page, nom: nom, filtre: filtre })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('modifiercouleur', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const nom = donnees.nom
			const couleur = donnees.couleur
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].forEach(function (item) {
							if (item.name === nom && (item.objet === 'rectangle' || item.objet === 'cercle' || item.objet === 'dessin')) {
								item.stroke = couleur
							} else if (item.name === nom && (item.objet === 'rectangle-plein' || item.objet === 'cercle-plein' || item.objet === 'etoile' || item.objet === 'surlignage' || item.objet === 'texte')) {
								item.fill = couleur
							} else if (item.name === nom && (item.objet === 'ligne' || item.objet === 'fleche' || item.objet === 'ancre')) {
								item.stroke = couleur
								item.fill = couleur
							} else if (item.name === nom && item.objet === 'label') {
								item.tag.fill = couleur
							}
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('modifiercouleur', { page: page, nom: nom, couleur: couleur })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('modifierfond', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			socket.to('tableau-' + tableau).emit('modifierfond', { fond: donnees.fond })
			socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
			socket.handshake.session.save()
		}
	})

	socket.on('ajouterpage', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau.splice(donnees.page, 0, [])
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau ), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('ajouterpage')
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('reajouterpage', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const items = donnees.items
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau.splice(page, 0, items)
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau ), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('reajouterpage', { page: page, items: items })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('deplacerpage', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					const ancienIndex = donnees.ancienIndex
					const nouvelIndex = donnees.nouvelIndex
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						const donneesPage = donneesTableau.splice(ancienIndex, 1)[0]
						donneesTableau.splice(nouvelIndex, 0, donneesPage)
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau ), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('deplacerpage', { ancienIndex: ancienIndex, nouvelIndex: nouvelIndex })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('supprimerpage', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau.splice(donnees.page, 1)
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau ), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('supprimerpage', { page: donnees.page })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('importer', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			socket.to('tableau-' + tableau).emit('importer', { items: donnees.items })
			socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
			socket.handshake.session.save()
		}
	})

	socket.on('supprimer', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const nom = donnees.nom
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						donneesTableau[page].forEach(function (item, index) {
							if (item.name.includes(nom)) {
								donneesTableau[page].splice(index, 1)
							}
						})
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('supprimer', { page: page, nom: nom })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('supprimerselection', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined) {
			const page = donnees.page
			const noms = donnees.noms
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('tableaux:' + tableau, function (err, reponse) {
						if (err) { socket.emit('erreur'); return false }
						const donneesTableau = JSON.parse(reponse.donnees)
						for (let i = 0; i < donneesTableau[page].length; i++) {
							for (let j = 0; j < noms.length; j++) {
								if (donneesTableau[page][i].name.includes(noms[j])) {
									donneesTableau[page].splice(i, 1)
								}
							}
						}
						db.hset('tableaux:' + tableau, 'donnees', JSON.stringify(donneesTableau), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to('tableau-' + tableau).emit('supprimerselection', { page: page, noms: noms })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					})
				}
			})
		}
	})

	socket.on('modifierstatututilisateur', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined && socket.handshake.session.statut === 'auteur' && socket.handshake.session.tableaux.includes(tableau)) {
			if (socket.handshake.session.identifiant === donnees.identifiant) {
				socket.handshake.session.statut = donnees.statut
			} else {
				io.in('tableau-' + tableau).emit('modifierstatututilisateur', { admin: donnees.admin, identifiant: donnees.identifiant, statut: donnees.statut })
			}
			socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
			socket.handshake.session.save()
		}
	})

	socket.on('modifierlangue', function (langue) {
		socket.handshake.session.langue = langue
		socket.handshake.session.save()
	})

	socket.on('modifieredition', function (donnees) {
		const tableau = donnees.tableau
		db.exists('tableaux:' + tableau, function (err, resultat) {
			if (err) { socket.emit('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('tableaux:' + tableau, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const options = JSON.parse(reponse.options)
					options.edition = donnees.edition
					db.hset('tableaux:' + tableau, 'options', JSON.stringify(options), function (err) {
						if (err) { socket.emit('erreur'); return false }
						io.in('tableau-' + tableau).emit('modifieredition', donnees.edition)
						socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
						socket.handshake.session.save()
					})
				})
			}
		})
	})

	socket.on('modifiermultipage', function (donnees) {
		const tableau = donnees.tableau
		db.exists('tableaux:' + tableau, function (err, resultat) {
			if (err) { socket.emit('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('tableaux:' + tableau, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const options = JSON.parse(reponse.options)
					options.multipage = donnees.multipage
					db.hset('tableaux:' + tableau, 'options', JSON.stringify(options), function (err) {
						if (err) { socket.emit('erreur'); return false }
						io.in('tableau-' + tableau).emit('modifiermultipage', donnees.multipage)
						socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
						socket.handshake.session.save()
					})
				})
			}
		})
	})

	socket.on('reinitialiser', function (donnees) {
		const tableau = donnees.tableau
		if (socket.handshake.session.identifiant !== '' && socket.handshake.session.identifiant !== undefined && socket.handshake.session.statut === 'auteur' && socket.handshake.session.tableaux.includes(tableau)) {
			db.exists('tableaux:' + tableau, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hset('tableaux:' + tableau, 'donnees', JSON.stringify([[]]), function (err) {
						if (err) { socket.emit('erreur'); return false }
						io.in('tableau-' + tableau).emit('reinitialiser')
						socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
						socket.handshake.session.save()
					})
				}
			})
		}
	})

	socket.on('supprimerimages', function (donnees) {
		for (let i = 0; i < donnees.images.length; i++) {
			const chemin = path.join(__dirname, '..', '/static/fichiers/' + donnees.tableau + '/' + donnees.images[i])
			fs.removeSync(chemin)
		}
	})
})

function choisirNom () {
	const noms = ['Chimpanzé', 'Hippopotame', 'Gnou', 'Yack', 'Aigle', 'Éléphant', 'Crocodile', 'Papillon', 'Humanoïde', 'Buffle', 'Hibou', 'Pingouin', 'Phoque', 'Pinson', 'Rhinocéros', 'Zèbre']
	const nom = noms[Math.floor(Math.random() * noms.length)]
	return nom
}

function choisirAdjectif () {
	const adjectifs = ['hilare', 'extraordinaire', 'fantastique', 'pétillant', 'magnifique', 'fabuleux', 'joyeux', 'sympathique', 'courageux', 'créatif', 'astucieux', 'vaillant', 'sage']
	const adjectif = adjectifs[Math.floor(Math.random() * adjectifs.length)]
	return adjectif
}

const televerser = multer({
	storage: multer.diskStorage({
		destination: function (req, fichier, callback) {
			const tableau = req.body.tableau
			const chemin = path.join(__dirname, '..', '/static/fichiers/' + tableau + '/')
			callback(null, chemin)
		},
		filename: function (req, fichier, callback) {
			const info = path.parse(fichier.originalname)
			const extension = info.ext.toLowerCase()
			let nom = v.latinise(info.name.toLowerCase())
			nom = nom.replace(/\ /gi, '-')
			nom = nom.replace(/[^0-9a-z_\-]/gi, '')
			if (nom.length > 100) {
				nom = nom.substring(0, 100)
			}
			nom = nom + '_' + Math.random().toString(36).substring(2) + extension
			callback(null, nom)
		}
	})
}).single('fichier')

const televerserArchive = multer({
	storage: multer.diskStorage({
		destination: function (req, fichier, callback) {
			const chemin = path.join(__dirname, '..', '/static/temp/')
			callback(null, chemin)
		},
		filename: function (req, fichier, callback) {
			const info = path.parse(fichier.originalname)
			const extension = info.ext.toLowerCase()
			let nom = v.latinise(info.name.toLowerCase())
			nom = nom.replace(/\ /gi, '-')
			nom = nom.replace(/[^0-9a-z_\-]/gi, '')
			if (nom.length > 100) {
				nom = nom.substring(0, 100)
			}
			nom = nom + '_' + Math.random().toString(36).substring(2) + extension
			callback(null, nom)
		}
	})
}).single('fichier')

}catch(e){

	console.log(e)
}
