require('dotenv').config()
const http = require('http')
const path = require('path')
const fs = require('fs-extra')
const { Nuxt, Builder } = require('nuxt')
const express = require('express')
const app = express()
const server = http.createServer(app)
const cors = require('cors')
const io = require('socket.io')(server, { cookie: false })
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const WebSocket = require('ws');
const ws = new WebSocket("ws://board-app:50001")
let ipUtilisateurs = new Map(); 
let db
let db_port = 6379
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
const PDFDocument = require('pdfkit')
const sharp = require('sharp')
const archiver = require('archiver')
const extract = require('extract-zip')
const moment = require('moment')
const bcrypt = require('bcrypt')
const cron = require('node-cron')
const nodemailer = require('nodemailer')
let storeOptions, cookie, dureeSession
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
	name: 'digistorm',
	resave: false,
	rolling: true,
	saveUninitialized: false,
	cookie: cookie
}
if (process.env.SESSION_DURATION) {
	dureeSession = parseInt(process.env.SESSION_DURATION)
} else {
	dureeSession = 864000000 //3600 * 24 * 10 * 1000
}
const expressSession = session(sessionOptions)
const sharedsession = require('express-socket.io-session')
const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: 465,
	secure: true,
	auth: {
		user: process.env.EMAIL_ADDRESS,
		pass: process.env.EMAIL_PASSWORD
	}
})
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

const t = require(path.join(__dirname, '..', '/lang/lang.js'))

app.set('trust proxy', true)
app.use(helmet())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(expressSession)
io.use(sharedsession(expressSession, {
	autoSave: true
}))
app.use(cors())

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
                name:"digistrom",
                data:data
            },
            {
                type:"integration",
                name:"digistrom",
                logo:"https://pouet.chapril.org/system/accounts/avatars/000/096/847/original/841401129f94028b.png",
            }
            ));
	
        });
		
    }, 10000);
}

envoiejson()


app.get('/', function (req, res) {
	const identifiant = req.session.identifiant
	if (identifiant && req.session.statut === 'utilisateur') {
		res.redirect('/u/' + identifiant)
	} else {
		req.next()
	}
})

app.get('/u/:u', function(req, res) {
	const identifiant = req.params.u
	if (identifiant === req.session.identifiant && req.session.statut === 'utilisateur') {
		req.next()
	} else {
		res.redirect('/')
	}
})

app.get('/p/:code', function (req) {
	if (req.session.identifiant === '' || req.session.identifiant === undefined) {
		const identifiant = 'u' + Math.random().toString(16).slice(3)
		req.session.identifiant = identifiant
		req.session.nom = ''
		req.session.email = ''
		req.session.langue = 'fr'
		req.session.statut = 'invite'
		req.session.interactions = []
		req.session.filtre = 'date-desc'
		ipUtilisateurs.set(identifiant, req.ip)
		req.session.cookie.expires = new Date(Date.now() + dureeSession)
	}
	req.next()
})

app.post('/api/s-inscrire', function (req, res) {
	const identifiant = req.body.identifiant
	const motdepasse = req.body.motdepasse
	db.exists('utilisateurs:' + identifiant, function (err, reponse) {
		if (err) { res.send('erreur') }
		if (reponse === 0) {
			const hash = bcrypt.hashSync(motdepasse, 10)
			const date = moment().format()
			const multi = db.multi()
			multi.hmset('utilisateurs:' + identifiant, 'id', identifiant, 'motdepasse', hash, 'date', date, 'nom', '', 'langue', 'fr')
			multi.exec(function () {
				req.session.identifiant = identifiant
				req.session.nom = ''
				req.session.email = ''
				if (req.session.langue === '' || req.session.langue === undefined) {
					req.session.langue = 'fr'
				}
				req.session.statut = 'utilisateur'
				req.session.cookie.expires = new Date(Date.now() + dureeSession)
				req.session.filtre = 'date-desc'
				res.json({ identifiant: identifiant, nom: '', langue: 'fr', statut: 'utilisateur' })
			})
		} else {
			res.send('utilisateur_existe_deja')
		}
	})
})

app.post('/api/se-connecter', function (req, res) {
	const identifiant = req.body.identifiant
	const motdepasse = req.body.motdepasse
	db.exists('utilisateurs:' + identifiant, function (err, reponse) {
		if (err) { res.send('erreur_connexion'); return false }
		if (reponse === 1 && req.session.identifiant !== identifiant) {
			db.hgetall('utilisateurs:' + identifiant, function (err, donnees) {
				if (err) { res.send('erreur_connexion'); return false }
				if (bcrypt.compareSync(motdepasse, donnees.motdepasse) || (donnees.hasOwnProperty('motdepassetemp') && bcrypt.compareSync(motdepasse, donnees.motdepassetemp))) {
					if (donnees.hasOwnProperty('motdepassetemp') && bcrypt.compareSync(motdepasse, donnees.motdepassetemp)) {
						const hash = bcrypt.hashSync(motdepasse, 10)
						db.hset('utilisateurs:' + identifiant, 'motdepasse', hash)
						db.hdel('utilisateurs:' + identifiant, 'motdepassetemp')
					}
					const nom = donnees.nom
					const langue = donnees.langue
					req.session.identifiant = identifiant
					req.session.nom = nom
					req.session.langue = langue
					req.session.statut = 'utilisateur'
					req.session.cookie.expires = new Date(Date.now() + dureeSession)
					let filtre = 'date-desc'
					if (donnees.hasOwnProperty('filtre')) {
						filtre = donnees.filtre
					}
					req.session.filtre = filtre
					let email = ''
					if (donnees.hasOwnProperty('email')) {
						email = donnees.email
					}
					req.session.email = email
					res.json({ identifiant: identifiant, nom: nom, email: email, langue: langue, statut: 'utilisateur', filtre: filtre })
				} else {
					res.send('erreur_connexion')
				}
			})
		} else {
			res.send('erreur_connexion')
		}
	})
})

app.post('/api/mot-de-passe-oublie', function (req, res) {
	const identifiant = req.body.identifiant
	let email = req.body.email
	db.exists('utilisateurs:' + identifiant, function (err, reponse) {
		if (err) { res.send('erreur'); return false }
		if (reponse === 1) {
			db.hgetall('utilisateurs:' + identifiant, function (err, donnees) {
				if ((donnees.hasOwnProperty('email') && donnees.email === email) || (verifierEmail(identifiant) === true)) {
					if (!donnees.hasOwnProperty('email') || (donnees.hasOwnProperty('email') && donnees.email === '')) {
						email = identifiant
					}
					const motdepasse = genererMotDePasse(7)
					const message = {
						from: '"La Digitale" <' + process.env.EMAIL_ADDRESS + '>',
						to: email,
						subject: 'Mot de passe Digistorm',
						html: '<p>Votre nouveau mot de passe : ' + motdepasse + '</p>'
					}
					transporter.sendMail(message, function (err) {
						if (err) {
							res.send('erreur')
						} else {
							const hash = bcrypt.hashSync(motdepasse, 10)
							db.hset('utilisateurs:' + identifiant, 'motdepassetemp', hash)
							res.send('message_envoye')
						}
					})
				} else {
					res.send('email_invalide')
				}
			})
		} else {
			res.send('identifiant_invalide')
		}
	})
})

app.post('/api/se-deconnecter', function (req, res) {
	req.session.identifiant = ''
	req.session.nom = ''
	req.session.email = ''
	req.session.langue = ''
	req.session.statut = ''
	req.session.interactions = []
	req.session.filtre = ''
	req.session.destroy()
	res.send('deconnecte')
})

app.post('/api/recuperer-donnees-utilisateur', function (req, res) {
	const identifiant = req.body.identifiant
	recupererDonnees(identifiant).then(function (resultat) {
		res.json({ interactions: resultat[0] })
	})
})

app.post('/api/modifier-langue', function (req, res) {
	const langue = req.body.langue
	req.session.langue = langue
	res.send('langue_modifiee')
})

app.post('/api/modifier-nom', function (req, res) {
	const nom = req.body.nom
	req.session.nom = nom
	res.send('nom_modifie')
})

app.post('/api/modifier-filtre', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const filtre = req.body.filtre
		db.hset('utilisateurs:' + identifiant, 'filtre', filtre)
		req.session.filtre = filtre
		res.send('filtre_modifie')
	} else {
		res.send('non_connecte')
	}
})

app.post('/api/modifier-informations-utilisateur', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const nom = req.body.nom
		const email = req.body.email
		db.hmset('utilisateurs:' + identifiant, 'nom', nom, 'email', email)
		req.session.nom = nom
		req.session.email = email
		res.send('utilisateur_modifie')
	} else {
		res.send('non_connecte')
	}
})

app.post('/api/modifier-mot-de-passe-utilisateur', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		db.hgetall('utilisateurs:' + identifiant, function (err, donnees) {
			if (err) { res.send('erreur'); return false }
			if (bcrypt.compareSync(req.body.motdepasse, donnees.motdepasse)) {
				const hash = bcrypt.hashSync(req.body.nouveaumotdepasse, 10)
				db.hset('utilisateurs:' + identifiant, 'motdepasse', hash)
				res.send('motdepasse_modifie')
			} else {
				res.send('motdepasse_incorrect')
			}
		})
	} else {
		res.send('non_connecte')
	}
})

app.post('/api/modifier-langue-utilisateur', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const langue = req.body.langue
		db.hset('utilisateurs:' + identifiant, 'langue', langue)
		req.session.langue = langue
		res.send('langue_modifiee')
	} else {
		res.send('non_connecte')
	}
})

app.post('/api/supprimer-compte', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		db.smembers('interactions-creees:' + identifiant, function (err, interactions) {
			if (err) { res.send('erreur'); return false }
			const donneesInteractions = []
			for (const interaction of interactions) {
				const donneesInteraction = new Promise(function (resolve) {
					db.del('interactions:' + interaction)
					const chemin = path.join(__dirname, '..', '/static/fichiers/' + interaction)
					fs.removeSync(chemin)
					resolve(interaction)
				})
				donneesInteractions.push(donneesInteraction)
			}
			Promise.all(donneesInteractions).then(function () {
				const multi = db.multi()
				multi.del('interactions-creees:' + identifiant)
				multi.del('utilisateurs:' + identifiant)
				multi.exec(function () {
					req.session.identifiant = ''
					req.session.nom = ''
					req.session.email = ''
					req.session.langue = ''
					req.session.statut = ''
					req.session.interactions = []
					req.session.filtre = ''
					req.session.destroy()
					res.send('compte_supprime')
				})
			})
		})
	} else {
		res.send('non_connecte')
	}
})

app.post('/api/rejoindre-interaction', function (req, res) {
	const code = parseInt(req.body.code)
	db.exists('interactions:' + code, function (err, reponse) {
		if (err) { res.send('erreur'); return false }
		if (reponse === 1) {
			if (req.session.identifiant === '' || req.session.identifiant === undefined) {
				const identifiant = 'u' + Math.random().toString(16).slice(3)
				req.session.identifiant = identifiant
				req.session.nom = ''
				req.session.email = ''
				req.session.langue = 'fr'
				req.session.statut = 'invite'
				req.session.interactions = []
				req.session.filtre = 'date-desc'
				req.session.cookie.expires = new Date(Date.now() + dureeSession)
			}
			res.json({ code: code, identifiant: req.session.identifiant })
		} else {
			res.send('erreur_code')
		}
	})
})

app.post('/api/creer-interaction', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const titre = req.body.titre
		const type = req.body.type
		const code = Math.floor(100000 + Math.random() * 900000)
		const date = moment().format()
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 0) {
				const multi = db.multi()
				multi.hmset('interactions:' + code, 'type', type, 'titre', titre, 'code', code, 'identifiant', identifiant, 'motdepasse', '', 'donnees', JSON.stringify({}), 'reponses', JSON.stringify({}), 'sessions', JSON.stringify({}), 'statut', '', 'session', 1, 'date', date)
				multi.sadd('interactions-creees:' + identifiant, code)
				multi.exec(function () {
					const chemin = path.join(__dirname, '..', '/static/fichiers/' + code)
					fs.mkdirsSync(chemin)
					res.json({ code: code })
				})
			} else {
				res.send('existe_deja')
			}
		})
	} else {
		res.send('non_connecte')
	}
})

app.post('/api/creer-interaction-sans-compte', function (req, res) {
	if (req.session.identifiant === '' || req.session.identifiant === undefined) {
		const identifiant = 'u' + Math.random().toString(16).slice(3)
		req.session.identifiant = identifiant
		req.session.interactions = []
	}
	const titre = req.body.titre
	const type = req.body.type
	const code = Math.floor(100000 + Math.random() * 900000)
	const motdepasse = creerMotDePasse()
	const date = moment().format()
	db.exists('interactions:' + code, function (err, reponse) {
		if (err) { res.send('erreur'); return false }
		if (reponse === 0) {
			db.hmset('interactions:' + code, 'type', type, 'titre', titre, 'code', code, 'motdepasse', motdepasse, 'donnees', JSON.stringify({}), 'reponses', JSON.stringify({}), 'sessions', JSON.stringify({}), 'statut', '', 'session', 1, 'date', date, function (err) {
				if (err) { res.send('erreur'); return false }
				const chemin = path.join(__dirname, '..', '/static/fichiers/' + code)
				fs.mkdirsSync(chemin)
				req.session.nom = ''
				req.session.email = ''
				if (req.session.langue === '' || req.session.langue === undefined) {
					req.session.langue = 'fr'
				}
				req.session.statut = 'auteur'
				req.session.interactions.push({ code: code, motdepasse: motdepasse })
				req.session.filtre = 'date-desc'
				req.session.cookie.expires = new Date(Date.now() + dureeSession)
				res.json({ code: code })
			})
		} else {
			res.send('existe_deja')
		}
	})
})

app.post('/api/modifier-interaction', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const code = parseInt(req.body.code)
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, resultat) {
					if (err) { res.send('erreur'); return false }
					const titre = req.body.titre
					const type = resultat.type
					const donnees = req.body.donnees
					const donneesActuelles = JSON.parse(resultat.donnees)
					const fichiersActuels = []
					const fichiers = []
					const corbeille = []
					if (Object.keys(donneesActuelles).length > 0) {
						if (Object.keys(donneesActuelles.support).length > 0) {
							if (donneesActuelles.support.hasOwnProperty('fichier')) {
								fichiersActuels.push(donneesActuelles.support.fichier)
							} else if (donneesActuelles.support.hasOwnProperty('image')) {
								fichiersActuels.push(donneesActuelles.support.image)
							}
						}
						if (type === 'Sondage' || type === 'Questionnaire') {
							if (donneesActuelles.hasOwnProperty('questions')) {
								donneesActuelles.questions.forEach(function (q) {
									q.items.forEach(function (item) {
										if (item.image !== '') {
											fichiersActuels.push(item.image)
										}
									})
								})
							} else {
								donneesActuelles.items.forEach(function (item) {
									if (item.image !== '') {
										fichiersActuels.push(item.image)
									}
								})
							}
						} else if (type === 'Remue-méninges') {
							donneesActuelles.categories.forEach(function (categorie) {
								if (categorie.image !== '') {
									fichiersActuels.push(categorie.image)
								}
							})
						}
						if (Object.keys(donnees.support).length > 0) {
							if (donnees.support.hasOwnProperty('fichier')) {
								fichiers.push(donnees.support.fichier)
							} else if (donnees.support.hasOwnProperty('image')) {
								fichiers.push(donnees.support.image)
							}
						}
						if (type === 'Sondage' || type === 'Questionnaire') {
							if (donnees.hasOwnProperty('questions')) {
								donnees.questions.forEach(function (q) {
									q.items.forEach(function (item) {
										if (item.image !== '') {
											fichiers.push(item.image)
										}
									})
								})
							} else {
								donnees.items.forEach(function (item) {
									if (item.image !== '') {
										fichiers.push(item.image)
									}
								})
							}
						} else if (type === 'Remue-méninges') {
							donnees.categories.forEach(function (categorie) {
								if (categorie.image !== '') {
									fichiers.push(categorie.image)
								}
							})
						}
						fichiersActuels.forEach(function (fichier) {
							if (!fichiers.includes(fichier)) {
								corbeille.push(fichier)
							}
						})
					}
					db.hmset('interactions:' + code, 'titre', titre, 'donnees', JSON.stringify(donnees), function (err) {
						if (err) { res.send('erreur'); return false }
						if (corbeille.length > 0) {
							corbeille.forEach(function (fichier) {
								supprimerFichier(code, fichier)
							})
						}
						res.send('donnees_enregistrees')
					})
				})
			} else {
				res.send('erreur_code')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/modifier-statut-interaction', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const code = parseInt(req.body.code)
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				const statut = req.body.statut
				if (statut === 'ouvert') {
					db.hgetall('interactions:' + code, function (err, resultat) {
						if (err) { res.send('erreur'); return false }
						const date = moment().format()
						const session = resultat.session
						const sessions = JSON.parse(resultat.sessions)
						sessions[session] = {}
						sessions[session].debut = date
						db.hmset('interactions:' + code, 'statut', statut, 'sessions', JSON.stringify(sessions), function (err) {
							if (err) { res.send('erreur'); return false }
							res.send('statut_modifie')
						})
					})
				} else {
					db.hset('interactions:' + code, 'statut', statut, function (err) {
						if (err) { res.send('erreur'); return false }
						res.send('statut_modifie')
					})
				}
			} else {
				res.send('erreur_code')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/modifier-index-question', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const code = parseInt(req.body.code)
		const indexQuestion = req.body.indexQuestion
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, resultat) {
					if (err) { res.send('erreur'); return false }
					const donnees = JSON.parse(resultat.donnees)
					donnees.indexQuestion = indexQuestion
					db.hset('interactions:' + code, 'donnees', JSON.stringify(donnees), function (err) {
						if (err) { res.send('erreur'); return false }
						res.send('index_modifie')
					})
				})
			} else {
				res.send('erreur_code')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/fermer-interaction', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const code = parseInt(req.body.code)
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, resultat) {
					if (err) { res.send('erreur'); return false }
					const date = moment().format()
					let session = resultat.session
					const type = resultat.type
					const donnees = JSON.parse(resultat.donnees)
					const reponses = JSON.parse(resultat.reponses)
					const sessions = JSON.parse(resultat.sessions)
					if (reponses[session] && reponses[session].length > 0) {
						sessions[session].fin = date
						sessions[session].donnees = donnees
						if (type === 'Questionnaire') {
							sessions[session].classement = req.body.classement
						}
					} else {
						delete sessions[session]
					}
					session = parseInt(session) + 1
					if (type === 'Questionnaire') {
						donnees.indexQuestion = donnees.copieIndexQuestion
						db.hmset('interactions:' + code, 'statut', 'termine', 'donnees', JSON.stringify(donnees), 'sessions', JSON.stringify(sessions), 'session', session, function (err) {
							if (err) { res.send('erreur'); return false }
							res.json({ session: session, reponses: reponses, sessions: sessions })
						})
					} else {
						db.hmset('interactions:' + code, 'statut', 'termine', 'sessions', JSON.stringify(sessions), 'session', session, function (err) {
							if (err) { res.send('erreur'); return false }
							res.json({ session: session, reponses: reponses, sessions: sessions })
						})
					}
				})
			} else {
				res.send('erreur_code')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/se-connecter-interaction', function (req, res) {
	if (req.session.identifiant === '' || req.session.identifiant === undefined) {
		const identifiant = 'u' + Math.random().toString(16).slice(3)
		req.session.identifiant = identifiant
		req.session.interactions = []
	}
	const code = parseInt(req.body.code)
	const motdepasse = req.body.motdepasse
	db.exists('interactions:' + code, function (err, reponse) {
		if (err) { res.send('erreur'); return false }
		if (reponse === 1) {
			db.hgetall('interactions:' + code, function (err, resultat) {
				if (err) { res.send('erreur'); return false }
				if (motdepasse !== '' && motdepasse === resultat.motdepasse) {
					req.session.nom = ''
					req.session.email = ''
					if (req.session.langue === '' || req.session.langue === undefined) {
						req.session.langue = 'fr'
					}
					req.session.statut = 'auteur'
					req.session.cookie.expires = new Date(Date.now() + dureeSession)
					req.session.interactions.push({ code: code, motdepasse: motdepasse })
					req.session.filtre = 'date-desc'
					res.json({ code: code, identifiant: req.session.identifiant, nom: '', langue: 'fr', statut: 'auteur', interactions: req.session.interactions })
				} else {
					res.send('non_autorise')
				}
			})
		} else {
			res.send('erreur_code')
		}
	})
})

app.post('/api/recuperer-donnees-interaction', function (req, res) {
	const code = parseInt(req.body.code)
	db.exists('interactions:' + code, function (err, reponse) {
		if (err) { res.send('erreur'); return false }
		if (reponse === 1) {
			db.hgetall('interactions:' + code, function (err, resultat) {
				if (err) { res.send('erreur'); return false }
				const type = resultat.type
				const titre = resultat.titre
				const donnees = JSON.parse(resultat.donnees)
				const reponses = JSON.parse(resultat.reponses)
				const sessions = JSON.parse(resultat.sessions)
				const statut = resultat.statut
				const session = parseInt(resultat.session)
				if (resultat.hasOwnProperty('identifiant')) {
					const identifiant = resultat.identifiant
					res.json({ type: type, titre: titre, identifiant: identifiant, motdepasse: '', donnees: donnees, reponses: reponses, sessions: sessions, statut: statut, session: session })
				} else if (resultat.hasOwnProperty('motdepasse')) {
					const motdepasse = resultat.motdepasse
					res.json({ type: type, titre: titre, identifiant: '', motdepasse: motdepasse, donnees: donnees, reponses: reponses, sessions: sessions, statut: statut, session: session })
				}
			})
		} else {
			res.send('erreur')
		}
	})
})

app.post('/api/telecharger-informations-interaction', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const code = parseInt(req.body.code)
		const motdepasse = req.body.motdepasse
		const type = req.body.type
		const titre = req.body.titre
		const domaine = req.body.domaine
		const doc = new PDFDocument()
		const fichier = code + '_' + Math.random().toString(36).substring(2, 12) + '.pdf'
		const chemin = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + fichier)
		const flux = fs.createWriteStream(chemin)
		doc.pipe(flux)
		doc.fontSize(16)
		if (type === 'Sondage') {
			doc.font('Helvetica-Bold').text(t[req.session.langue].sondage + ' - ' + titre)
		} else if (type === 'Questionnaire') {
			doc.font('Helvetica-Bold').text(t[req.session.langue].questionnaire + ' - ' + titre)
		} else if (type === 'Remue-méninges') {
			doc.font('Helvetica-Bold').text(t[req.session.langue].remueMeninges + ' - ' + titre)
		} else if (type === 'Nuage-de-mots') {
			doc.font('Helvetica-Bold').text(t[req.session.langue].nuageDeMots + ' - ' + titre)
		}
		doc.moveDown()
		doc.fontSize(12)
		doc.font('Helvetica').text(t[req.session.langue].code + ' ' + code)
		doc.moveDown()
		doc.font('Helvetica').text(t[req.session.langue].lien + ' ' + domaine + '/p/' + code)
		doc.moveDown()
		doc.font('Helvetica').text(t[req.session.langue].lienAdmin + ' ' + domaine + '/c/' + code)
		doc.moveDown()
		doc.font('Helvetica').text(t[req.session.langue].motdepasse + ' ' + motdepasse)
		doc.moveDown()
		doc.end()
		flux.on('finish', function () {
			res.send(fichier)
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/supprimer-informations-interaction', function (req, res) {
	const code = parseInt(req.body.code)
	const fichier = req.body.fichier
	supprimerFichier(code, fichier)
	res.send('fichier_supprime')
})

app.post('/api/dupliquer-interaction', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const interaction = parseInt(req.body.code)
		db.exists('interactions:' + interaction, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + interaction, function (err, parametres) {
					if (err) { res.send('erreur'); return false }
					const code = Math.floor(100000 + Math.random() * 900000)
					const date = moment().format()
					db.exists('interactions:' + code, function (err, reponse) {
						if (err) { res.send('erreur'); return false }
						if (reponse === 0) {
							const multi = db.multi()
							multi.hmset('interactions:' + code, 'type', parametres.type, 'titre', t[req.session.langue].copieDe + parametres.titre, 'code', code, 'identifiant', identifiant, 'motdepasse', '', 'donnees', parametres.donnees, 'reponses', JSON.stringify({}), 'sessions', JSON.stringify({}), 'statut', '', 'session', 1, 'date', date)
							multi.sadd('interactions-creees:' + identifiant, code)
							multi.exec(function () {
								if (fs.existsSync(path.join(__dirname, '..', '/static/fichiers/' + interaction))) {
									fs.copySync(path.join(__dirname, '..', '/static/fichiers/' + interaction), path.join(__dirname, '..', '/static/fichiers/' + code))
								}
								res.json({ type: parametres.type, titre: t[req.session.langue].copieDe + parametres.titre, code: code, identifiant: identifiant, motdepasse: '', donnees: JSON.parse(parametres.donnees), reponses: {}, sessions: {}, statut: '', session: 1, date: date })
							})
						} else {
							res.send('existe_deja')
						}
					})
				})
			} else {
				res.send('erreur_code')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/exporter-interaction', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const code = parseInt(req.body.code)
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, parametres) {
					if (err) { res.send('erreur'); return false }
					const chemin = path.join(__dirname, '..', '/static/temp')
					fs.mkdirpSync(path.normalize(chemin + '/' + code))
					fs.mkdirpSync(path.normalize(chemin + '/' + code + '/fichiers'))
					fs.writeFileSync(path.normalize(chemin + '/' + code + '/donnees.json'), JSON.stringify(parametres, '', 4), 'utf8')
					const donnees = JSON.parse(parametres.donnees)
					if (Object.keys(donnees).length > 0) {
						const fichiers = []
						if (Object.keys(donnees.support).length > 0) {
							if (donnees.support.hasOwnProperty('fichier')) {
								fichiers.push(donnees.support.fichier)
							} else if (donnees.support.hasOwnProperty('image')) {
								fichiers.push(donnees.support.image)
							}
						}
						if (parametres.type === 'Sondage' || parametres.type === 'Questionnaire') {
							if (donnees.hasOwnProperty('questions')) {
								donnees.questions.forEach(function (q) {
									if (Object.keys(q.support).length > 0) {
										if (q.support.hasOwnProperty('fichier')) {
											fichiers.push(q.support.fichier)
										} else if (q.support.hasOwnProperty('image')) {
											fichiers.push(q.support.image)
										}
									}
									q.items.forEach(function (item) {
										if (item.image !== '') {
											fichiers.push(item.image)
										}
									})
								})
							} else {
								donnees.items.forEach(function (item) {
									if (item.image !== '') {
										fichiers.push(item.image)
									}
								})
							}
						} else if (parametres.type === 'Remue-méninges') {
							donnees.categories.forEach(function (categorie) {
								if (categorie.image !== '') {
									fichiers.push(categorie.image)
								}
							})
						}
						for (const fichier of fichiers) {
							if (fs.existsSync(path.join(__dirname, '..', '/static/fichiers/' + code + '/' + fichier))) {
								fs.copySync(path.join(__dirname, '..', '/static/fichiers/' + code + '/' + fichier), path.normalize(chemin + '/' + code + '/fichiers/' + fichier, { overwrite: true }))
							}
						}
						const archiveId = Math.floor((Math.random() * 100000) + 1)
						const sortie = fs.createWriteStream(path.normalize(chemin + '/' + code + '_' + archiveId + '.zip'))
						const archive = archiver('zip', {
							zlib: { level: 9 }
						})
						sortie.on('finish', function () {
							fs.removeSync(path.normalize(chemin + '/' + code))
							res.send(code + '_' + archiveId + '.zip')
						})
						archive.pipe(sortie)
						archive.directory(path.normalize(chemin + '/' + code), false)
						archive.finalize()
					} else {
						res.send('erreur_donnees')
					}
				})
			} else {
				res.send('erreur_code')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/importer-interaction', function (req, res) {
	const identifiant = req.session.identifiant
	if (!identifiant) {
		res.send('non_autorise')
	} else {
		televerserArchive(req, res, async function (err) {
			if (err) { res.send('erreur_import'); return false }
			try {
				const source = path.join(__dirname, '..', '/static/temp/' + req.file.filename)
				const cible = path.join(__dirname, '..', '/static/temp/archive-' + Math.floor((Math.random() * 100000) + 1))
				await extract(source, { dir: cible })
				const donnees = await fs.readJson(path.normalize(cible + '/donnees.json'))
				const parametres = JSON.parse(req.body.parametres)
				// Vérification des clés des données
				if (donnees.hasOwnProperty('type') && donnees.hasOwnProperty('titre') && donnees.hasOwnProperty('code') && donnees.hasOwnProperty('motdepasse') && donnees.hasOwnProperty('donnees') && donnees.hasOwnProperty('reponses') && donnees.hasOwnProperty('sessions') && donnees.hasOwnProperty('statut') && donnees.hasOwnProperty('session') && donnees.hasOwnProperty('date')) {
					const code = Math.floor(100000 + Math.random() * 900000)
					const date = moment().format()
					db.exists('interactions:' + code, function (err, reponse) {
						if (err) { res.send('erreur'); return false }
						if (reponse === 0) {
							const multi = db.multi()
							if (parametres.resultats === true) {
								multi.hmset('interactions:' + code, 'type', donnees.type, 'titre', donnees.titre, 'code', code, 'identifiant', identifiant, 'motdepasse', '', 'donnees', donnees.donnees, 'reponses', donnees.reponses, 'sessions', donnees.sessions, 'statut', '', 'session', donnees.session, 'date', date)
							} else {
								multi.hmset('interactions:' + code, 'type', donnees.type, 'titre', donnees.titre, 'code', code, 'identifiant', identifiant, 'motdepasse', '', 'donnees', donnees.donnees, 'reponses', JSON.stringify({}), 'sessions', JSON.stringify({}), 'statut', '', 'session', 1, 'date', date)
							}
							multi.sadd('interactions-creees:' + identifiant, code)
							multi.exec(function () {
								const chemin = path.join(__dirname, '..', '/static/fichiers/' + code)
								fs.moveSync(path.normalize(cible + '/fichiers'), chemin)
								if (parametres.resultats === true) {
									res.json({ type: donnees.type, titre: donnees.titre, code: code, identifiant: identifiant, motdepasse: '', donnees: JSON.parse(donnees.donnees), reponses: JSON.parse(donnees.reponses), sessions: JSON.parse(donnees.sessions), statut: '', session: donnees.session, date: date })
								} else {
									res.json({ type: donnees.type, titre: donnees.titre, code: code, identifiant: identifiant, motdepasse: '', donnees: JSON.parse(donnees.donnees), reponses: {}, sessions: {}, statut: '', session: 1, date: date })
								}
							})
						} else {
							res.send('existe_deja')
						}
					})
				} else {
					fs.removeSync(source)
					fs.removeSync(cible)
					res.send('donnees_corrompues')
				}
			} catch (err) {
				fs.removeSync(path.join(__dirname, '..', '/static/temp/' + req.file.filename))
				res.send('erreur_import')
			}
		})
	}
})

app.post('/api/supprimer-interaction', function (req, res) {
	const code = parseInt(req.body.code)
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				if (req.session.statut === 'auteur') {
					db.del('interactions:' + code)
					const chemin = path.join(__dirname, '..', '/static/fichiers/' + code)
					fs.removeSync(chemin)
					res.send('interaction_supprimee')
				} else if (req.session.statut === 'utilisateur') {
					const multi = db.multi()
					multi.del('interactions:' + code)
					multi.srem('interactions-creees:' + identifiant, code)
					multi.exec(function () {
						const chemin = path.join(__dirname, '..', '/static/fichiers/' + code)
						fs.removeSync(chemin)
						res.send('interaction_supprimee')
					})
				}
			} else {
				res.send('erreur_code')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/exporter-resultat', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const code = parseInt(req.body.code)
		const type = req.body.type
		const titre = req.body.titre
		const donnees = req.body.donnees
		const reponses = req.body.reponses
		const dateDebut = req.body.dateDebut
		const dateFin = req.body.dateFin
		const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
		const doc = new PDFDocument()
		const chemin = path.join(__dirname, '..', '/static/fichiers/' + code + '/resultats.pdf')
		const flux = fs.createWriteStream(chemin)
		doc.pipe(flux)
		doc.fontSize(16)
		if (type === 'Sondage') {
			doc.font('Helvetica-Bold').text(t[req.session.langue].sondage + ' - ' + titre)
		} else if (type === 'Questionnaire') {
			doc.font('Helvetica-Bold').text(t[req.session.langue].questionnaire + ' - ' + titre)
		} else if (type === 'Remue-méninges') {
			doc.font('Helvetica-Bold').text(t[req.session.langue].remueMeninges + ' - ' + titre)
		} else if (type === 'Nuage-de-mots') {
			doc.font('Helvetica-Bold').text(t[req.session.langue].nuageDeMots + ' - ' + titre)
		}
		doc.fontSize(10)
		doc.moveDown()
		if (type === 'Sondage' && donnees.hasOwnProperty('question')) {
			doc.fontSize(8)
			doc.font('Helvetica').text(formaterDate(dateDebut, t[req.session.langue].demarre, req.session.langue) + ' - ' + formaterDate(dateFin, t[req.session.langue].termine, req.session.langue))
			doc.moveDown()
			doc.moveDown()
			doc.fontSize(12)
			doc.font('Helvetica-Bold').text(t[req.session.langue].question, { underline: true })
			if (donnees.question !== '') {
				doc.moveDown()
				doc.font('Helvetica-Bold').text(donnees.question)
			}
			if (Object.keys(donnees.support).length > 0) {
				doc.moveDown()
				const cheminSupport = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + donnees.support.image)
				if (fs.existsSync(cheminSupport)) {
					const support = fs.readFileSync(cheminSupport)
					doc.image(support, { fit: [120, 120] })
				} else {
					doc.fontSize(10)
					doc.font('Helvetica').text(t[req.session.langue].image + ' ' + donnees.support.alt)
				}
			}
			doc.moveDown()
			doc.fontSize(12)
			doc.font('Helvetica-Bold').text(t[req.session.langue].reponses + ' (' + reponses.length + ')', { underline: true })
			doc.moveDown()
			const items = donnees.items
			const statistiques = definirStatistiquesSondage(items, reponses)
			items.forEach(function (item, index) {
				if (item.texte !== '') {
					doc.fontSize(10)
					doc.font('Helvetica').text(alphabet[index] + '. ' + item.texte + ' (' + statistiques.pourcentages[index] + '% - ' + statistiques.personnes[index] + ')')
					if (item.image !== '') {
						const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + item.image)
						if (fs.existsSync(cheminImage)) {
							const image = fs.readFileSync(cheminImage)
							doc.image(image, { fit: [75, 75] })
						}
					}
				} else if (item.image !== '') {
					doc.fontSize(10)
					const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + item.image)
					if (fs.existsSync(cheminImage)) {
						const image = fs.readFileSync(cheminImage)
						doc.font('Helvetica').text(alphabet[index] + '. (' + statistiques.pourcentages[index] + '% - ' + statistiques.personnes[index] + ')').image(image, { fit: [75, 75] })
					} else {
						doc.font('Helvetica').text(alphabet[index] + '. ' + item.alt + ' (' + statistiques.pourcentages[index] + '% - ' + statistiques.personnes[index] + ')')
					}
				}
				doc.moveDown()
			})
		} else if (type === 'Sondage' && donnees.hasOwnProperty('questions')) {
			const statistiques = definirStatistiquesQuestions(donnees.questions, reponses)
			doc.fontSize(8)
			doc.font('Helvetica').text(formaterDate(dateDebut, t[req.session.langue].demarre, req.session.langue) + ' - ' + formaterDate(dateFin, t[req.session.langue].termine, req.session.langue))
			doc.moveDown()
			if (donnees.options.progression === 'libre') {
				doc.font('Helvetica').text(t[req.session.langue].progression + ' ' + t[req.session.langue].progressionLibre)
			} else {
				doc.font('Helvetica').text(t[req.session.langue].progression + ' ' + t[req.session.langue].progressionAnimateur)
			}
			doc.moveDown()
			doc.moveDown()
			if (donnees.description !== '') {
				doc.fontSize(12)
				doc.font('Helvetica-Bold').text(t[req.session.langue].description)
				doc.fontSize(10)
				doc.moveDown()
				doc.font('Helvetica').text(donnees.description)
			}
			if (donnees.description !== '' && Object.keys(donnees.support).length > 0) {
				doc.fontSize(12)
				doc.moveDown()
			}
			if (Object.keys(donnees.support).length > 0) {
				doc.fontSize(12)
				doc.font('Helvetica-Bold').text(t[req.session.langue].support)
				doc.fontSize(10)
				doc.moveDown()
				if (donnees.support.type === 'image') {
					const cheminSupport = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + donnees.support.fichier)
					if (fs.existsSync(cheminSupport)) {
						const support = fs.readFileSync(cheminSupport)
						doc.image(support, { fit: [120, 120] })
					} else {
						doc.font('Helvetica').text(t[req.session.langue].image + ' ' + donnees.support.alt)
					}
				} else if (donnees.support.type === 'audio') {
					doc.font('Helvetica').text(t[req.session.langue].fichierAudio + ' ' + donnees.support.alt)
				} else if (donnees.support.type === 'video') {
					doc.font('Helvetica').text(t[req.session.langue].video + ' ' + donnees.support.lien)
				}
			}
			if (donnees.description !== '' || Object.keys(donnees.support).length > 0) {
				doc.fontSize(12)
				doc.moveDown()
				doc.moveDown()
			}
			donnees.questions.forEach(function (q, indexQ) {
				doc.fontSize(14)
				doc.font('Helvetica-Bold').fillColor('black').text(t[req.session.langue].question + ' ' + (indexQ + 1))
				doc.fontSize(10)
				doc.font('Helvetica').text('-----------------------------------------------')
				doc.fontSize(14)
				doc.moveDown()
				doc.fontSize(12)
				doc.font('Helvetica-Bold').text(t[req.session.langue].question)
				if (q.question !== '') {
					doc.moveDown()
					doc.font('Helvetica-Bold').text(q.question)
				}
				if (Object.keys(q.support).length > 0) {
					doc.moveDown()
					const cheminSupport = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + q.support.image)
					if (fs.existsSync(cheminSupport)) {
						const support = fs.readFileSync(cheminSupport)
						doc.image(support, { fit: [120, 120] })
					}
				}
				doc.moveDown()
				doc.moveDown()
				doc.fontSize(12)
				doc.font('Helvetica-Bold').text(t[req.session.langue].reponses + ' (' + definirReponses(reponses, indexQ) + ')')
				doc.moveDown()
				q.items.forEach(function (item, index) {
					if (item.texte !== '') {
						doc.fontSize(10)
						doc.font('Helvetica').text(alphabet[index] + '. ' + item.texte + ' (' + statistiques[indexQ].pourcentages[index] + '% - ' + statistiques[indexQ].personnes[index] + ')')
						if (item.image !== '') {
							const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + item.image)
							if (fs.existsSync(cheminImage)) {
								const image = fs.readFileSync(cheminImage)
								doc.image(image, { fit: [75, 75] })
							}
						}
					} else if (item.image !== '') {
						doc.fontSize(10)
						const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + item.image)
						if (fs.existsSync(cheminImage)) {
							const image = fs.readFileSync(cheminImage)
							doc.font('Helvetica').text(alphabet[index] + '. (' + statistiques[indexQ].pourcentages[index] + '% - ' + statistiques[indexQ].personnes[index] + ')').image(image, { fit: [75, 75] })
						} else {
							doc.font('Helvetica').text(alphabet[index] + '. ' + item.alt + ' (' + statistiques[indexQ].pourcentages[index] + '% - ' + statistiques[indexQ].personnes[index] + ')')
						}
					}
					doc.moveDown()
				})
				doc.moveDown()
				doc.moveDown()
			})
		} else if (type === 'Questionnaire') {
			const statistiques = definirStatistiquesQuestions(donnees.questions, reponses)
			const classement = req.body.classement
			doc.fontSize(8)
			doc.font('Helvetica').text(formaterDate(dateDebut, t[req.session.langue].demarre, req.session.langue) + ' - ' + formaterDate(dateFin, t[req.session.langue].termine, req.session.langue))
			doc.moveDown()
			if (donnees.options.progression === 'libre') {
				doc.font('Helvetica').text(t[req.session.langue].progression + ' ' + t[req.session.langue].progressionLibre)
			} else {
				doc.font('Helvetica').text(t[req.session.langue].progression + ' ' + t[req.session.langue].progressionAnimateur)
			}
			doc.moveDown()
			doc.moveDown()
			if (donnees.description !== '') {
				doc.fontSize(12)
				doc.font('Helvetica-Bold').text(t[req.session.langue].description)
				doc.fontSize(10)
				doc.moveDown()
				doc.font('Helvetica').text(donnees.description)
			}
			if (donnees.description !== '' && Object.keys(donnees.support).length > 0) {
				doc.fontSize(12)
				doc.moveDown()
			}
			if (Object.keys(donnees.support).length > 0) {
				doc.fontSize(12)
				doc.font('Helvetica-Bold').text(t[req.session.langue].support)
				doc.fontSize(10)
				doc.moveDown()
				if (donnees.support.type === 'image') {
					const cheminSupport = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + donnees.support.fichier)
					if (fs.existsSync(cheminSupport)) {
						const support = fs.readFileSync(cheminSupport)
						doc.image(support, { fit: [120, 120] })
					} else {
						doc.font('Helvetica').text(t[req.session.langue].image + ' ' + donnees.support.alt)
					}
				} else if (donnees.support.type === 'audio') {
					doc.font('Helvetica').text(t[req.session.langue].fichierAudio + ' ' + donnees.support.alt)
				} else if (donnees.support.type === 'video') {
					doc.font('Helvetica').text(t[req.session.langue].video + ' ' + donnees.support.lien)
				}
			}
			if (donnees.description !== '' || Object.keys(donnees.support).length > 0) {
				doc.fontSize(12)
				doc.moveDown()
				doc.moveDown()
			}
			donnees.questions.forEach(function (q, indexQ) {
				doc.fontSize(14)
				doc.font('Helvetica-Bold').fillColor('black').text(t[req.session.langue].question + ' ' + (indexQ + 1))
				doc.fontSize(10)
				doc.font('Helvetica').text('-----------------------------------------------')
				doc.fontSize(14)
				doc.moveDown()
				doc.fontSize(12)
				doc.font('Helvetica-Bold').text(t[req.session.langue].question)
				if (q.question !== '') {
					doc.moveDown()
					doc.font('Helvetica-Bold').text(q.question)
				}
				if (Object.keys(q.support).length > 0) {
					doc.moveDown()
					const cheminSupport = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + q.support.image)
					if (fs.existsSync(cheminSupport)) {
						const support = fs.readFileSync(cheminSupport)
						doc.image(support, { fit: [120, 120] })
					}
				}
				doc.moveDown()
				doc.moveDown()
				doc.fontSize(12)
				doc.font('Helvetica-Bold').text(t[req.session.langue].reponses + ' (' + definirReponses(reponses, indexQ) + ')')
				doc.moveDown()
				q.items.forEach(function (item, index) {
					if (item.texte !== '') {
						doc.fontSize(10)
						if (item.reponse === true) {
							doc.font('Helvetica').fillColor('#00a695').text(alphabet[index] + '. ' + item.texte + ' (' + statistiques[indexQ].pourcentages[index] + '% - ' + statistiques[indexQ].personnes[index] + ') - ' + t[req.session.langue].bonneReponse)
						} else {
							doc.font('Helvetica').fillColor('grey').text(alphabet[index] + '. ' + item.texte + ' (' + statistiques[indexQ].pourcentages[index] + '% - ' + statistiques[indexQ].personnes[index] + ')')
						}
						if (item.image !== '') {
							const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + item.image)
							if (fs.existsSync(cheminImage)) {
								const image = fs.readFileSync(cheminImage)
								doc.image(image, { fit: [75, 75] })
							}
						}
					} else if (item.image !== '') {
						doc.fontSize(10)
						const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + item.image)
						if (fs.existsSync(cheminImage)) {
							const image = fs.readFileSync(cheminImage)
							if (item.reponse === true) {
								doc.font('Helvetica').fillColor('#00a695').text(alphabet[index] + '. (' + statistiques[indexQ].pourcentages[index] + '% - ' + statistiques[indexQ].personnes[index] + ') - ' + t[req.session.langue].bonneReponse).image(image, { fit: [75, 75] })
							} else {
								doc.font('Helvetica').fillColor('grey').text(alphabet[index] + '. (' + statistiques[indexQ].pourcentages[index] + '% - ' + statistiques[indexQ].personnes[index] + ')').image(image, { fit: [75, 75] })
							}
						} else {
							if (item.reponse === true) {
								doc.font('Helvetica').fillColor('#00a695').text(alphabet[index] + '. ' + item.alt + ' (' + statistiques[indexQ].pourcentages[index] + '% - ' + statistiques[indexQ].personnes[index] + ') - ' + t[req.session.langue].bonneReponse)
							} else {
								doc.font('Helvetica').fillColor('grey').text(alphabet[index] + '. ' + item.alt + ' (' + statistiques[indexQ].pourcentages[index] + '% - ' + statistiques[indexQ].personnes[index] + ')')
							}
						}
					}
					doc.moveDown()
				})
				doc.moveDown()
				doc.moveDown()
			})
			if (classement.length > 0 && donnees.options.nom === 'obligatoire') {
				doc.fontSize(14)
				doc.font('Helvetica-Bold').fillColor('black').text(t[req.session.langue].classement)
				doc.fontSize(10)
				doc.font('Helvetica').text('-----------------------------------------------')
				doc.fontSize(14)
				doc.moveDown()
				doc.fontSize(12)
				classement.forEach(function (utilisateur, indexUtilisateur) {
					doc.font('Helvetica').text((indexUtilisateur + 1) + '. ' + utilisateur.nom + ' (' + utilisateur.score + ' ' + t[req.session.langue].points + ')')
					doc.moveDown()
				})
			}
		} else if (type === 'Remue-méninges') {
			const categories = donnees.categories.filter(function (categorie) {
				return categorie.texte !== '' || categorie.image !== ''
			})
			const messages = definirMessagesRemueMeninges(categories, reponses)
			doc.fontSize(8)
			doc.font('Helvetica').text(formaterDate(dateDebut, t[req.session.langue].demarre, req.session.langue) + ' - ' + formaterDate(dateFin, t[req.session.langue].termine, req.session.langue))
			doc.moveDown()
			doc.moveDown()
			doc.fontSize(12)
			doc.font('Helvetica-Bold').text(t[req.session.langue].question, { underline: true })
			doc.moveDown()
			doc.font('Helvetica-Bold').text(donnees.question)
			if (Object.keys(donnees.support).length > 0) {
				doc.moveDown()
				const cheminSupport = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + donnees.support.image)
				if (fs.existsSync(cheminSupport)) {
					const support = fs.readFileSync(cheminSupport)
					doc.image(support, { fit: [120, 120] })
				}
			}
			doc.moveDown()
			doc.fontSize(12)
			// Messages visibles
			if (categories.length > 0) {
				let totalMessagesVisibles = 0
				messages.visibles.forEach(function (categorie) {
					totalMessagesVisibles = totalMessagesVisibles + categorie.length
				})
				doc.font('Helvetica-Bold').text(t[req.session.langue].reponses + ' (' + totalMessagesVisibles + ')', { underline: true })
				doc.moveDown()
				categories.forEach(function (categorie, index) {
					if (categorie.texte !== '') {
						doc.fontSize(10)
						doc.font('Helvetica-Bold').text((index + 1) + '. ' + categorie.texte + ' (' + messages.visibles[index].length + ')')
						if (categorie.image !== '') {
							const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + categorie.image)
							if (fs.existsSync(cheminImage)) {
								const image = fs.readFileSync(cheminImage)
								doc.image(image, { fit: [40, 40] })
								doc.moveDown()
							}
						}
						messages.visibles[index].forEach(function (message) {
							doc.fontSize(9)
							doc.font('Helvetica').text('• ' + message.reponse.texte)
						})
					} else if (categorie.image !== '') {
						doc.fontSize(10)
						const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + categorie.image)
						if (fs.existsSync(cheminImage)) {
							const image = fs.readFileSync(cheminImage)
							doc.font('Helvetica-Bold').text((index + 1) + '. (' + messages.visibles[index].length + ')').image(image, { fit: [40, 40] })
							doc.moveDown()
						} else {
							doc.font('Helvetica-Bold').text((index + 1) + '. ' + categorie.alt + ' (' + messages.visibles[index].length + ')')
						}
						messages.visibles[index].forEach(function (message) {
							doc.fontSize(9)
							doc.font('Helvetica').text('• ' + message.reponse.texte)
						})
					}
					doc.moveDown()
				})
			} else {
				doc.font('Helvetica-Bold').text(t[req.session.langue].reponses + ' (' + messages.visibles.length + ')', { underline: true })
				doc.moveDown()
				messages.visibles.forEach(function (message) {
					doc.fontSize(9)
					doc.font('Helvetica').text('• ' + message.reponse.texte)
				})
			}
			// Messages supprimés
			if (messages.supprimes.length > 0) {
				doc.moveDown()
				doc.fontSize(12)
				if (categories.length > 0) {
					let totalMessagesSupprimes = 0
					messages.supprimes.forEach(function (categorie) {
						totalMessagesSupprimes = totalMessagesSupprimes + categorie.length
					})
					doc.font('Helvetica-Bold').text(t[req.session.langue].messagesSupprimes + ' (' + totalMessagesSupprimes + ')', { underline: true })
					doc.moveDown()
					categories.forEach(function (categorie, index) {
						if (categorie.texte !== '') {
							doc.fontSize(10)
							doc.font('Helvetica-Bold').text((index + 1) + '. ' + categorie.texte + ' (' + messages.supprimes[index].length + ')')
							if (categorie.image !== '') {
								const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + categorie.image)
								if (fs.existsSync(cheminImage)) {
									const image = fs.readFileSync(cheminImage)
									doc.image(image, { fit: [40, 40] })
									doc.moveDown()
								}
							}
							messages.supprimes[index].forEach(function (message) {
								doc.fontSize(9)
								doc.font('Helvetica').text('• ' + message.reponse.texte)
							})
						} else if (categorie.image !== '') {
							doc.fontSize(10)
							const cheminImage = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + categorie.image)
							if (fs.existsSync(cheminImage)) {
								const image = fs.readFileSync(cheminImage)
								doc.font('Helvetica-Bold').text((index + 1) + '. (' + messages.supprimes[index].length + ')').image(image, { fit: [40, 40] })
								doc.moveDown()
							} else {
								doc.font('Helvetica-Bold').text((index + 1) + '. ' + categorie.alt + ' (' + messages.supprimes[index].length + ')')
							}
							messages.supprimes[index].forEach(function (message) {
								doc.fontSize(9)
								doc.font('Helvetica').text('• ' + message.reponse.texte)
							})
						}
						doc.moveDown()
					})
				} else {
					doc.font('Helvetica-Bold').text(t[req.session.langue].messagesSupprimes + ' (' + messages.supprimes.length + ')', { underline: true })
					doc.moveDown()
					messages.supprimes.forEach(function (message) {
						doc.fontSize(9)
						doc.font('Helvetica').text('• ' + message.reponse.texte)
					})
				}
			}
		} else if (type === 'Nuage-de-mots') {
			const mots = definirMotsNuageDeMots(reponses)
			doc.fontSize(8)
			doc.font('Helvetica').text(formaterDate(dateDebut, t[req.session.langue].demarre, req.session.langue) + ' - ' + formaterDate(dateFin, t[req.session.langue].termine, req.session.langue))
			doc.moveDown()
			doc.moveDown()
			doc.fontSize(12)
			doc.font('Helvetica-Bold').text(t[req.session.langue].question, { underline: true })
			doc.moveDown()
			doc.font('Helvetica-Bold').text(donnees.question)
			if (Object.keys(donnees.support).length > 0) {
				doc.moveDown()
				const cheminSupport = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + donnees.support.image)
				if (fs.existsSync(cheminSupport)) {
					const support = fs.readFileSync(cheminSupport)
					doc.image(support, { fit: [120, 120] })
				}
			}
			doc.moveDown()
			doc.fontSize(12)
			doc.font('Helvetica-Bold').text(t[req.session.langue].reponses + ' (' + mots.visibles.length + ')', { underline: true })
			doc.moveDown()
			mots.visibles.forEach(function (mot) {
				doc.fontSize(9)
				doc.font('Helvetica').text('• ' + mot.reponse.texte)
			})
			if (mots.supprimes.length > 0) {
				doc.moveDown()
				doc.fontSize(12)
				doc.font('Helvetica-Bold').text(t[req.session.langue].motsSupprimes + ' (' + mots.supprimes.length + ')', { underline: true })
				doc.moveDown()
				mots.supprimes.forEach(function (mot) {
					doc.fontSize(9)
					doc.font('Helvetica').text('• ' + mot.reponse.texte)
				})
			}
		}
		doc.end()
		flux.on('finish', function () {
			res.send('resultat_exporte')
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/supprimer-resultat', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const code = parseInt(req.body.code)
		const session = parseInt(req.body.session)
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, donnees) {
					if (err) { res.send('erreur'); return false }
					const reponses = JSON.parse(donnees.reponses)
					const sessions = JSON.parse(donnees.sessions)
					if (reponses[session]) {
						delete reponses[session]
					}
					if (sessions[session]) {
						delete sessions[session]
					}
					db.hmset('interactions:' + code, 'reponses', JSON.stringify(reponses), 'sessions', JSON.stringify(sessions), function (err) {
						if (err) { res.send('erreur'); return false }
						res.json({ reponses: reponses, sessions: sessions })
					})
				})
			} else {
				res.send('erreur_code')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/televerser-image', function (req, res) {
	const identifiant = req.session.identifiant
	if (!identifiant) {
		res.send('non_autorise')
	} else {
		televerser(req, res, function () {
			const fichier = req.file
			const alt = path.parse(fichier.originalname).name
			const code = req.body.code
			const chemin = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + fichier.filename)
			const extension = path.parse(fichier.filename).ext
			if (extension.toLowerCase() === '.jpg' || extension.toLowerCase() === '.jpeg') {
				sharp(chemin).withMetadata().rotate().jpeg().resize(1000, 1000, {
					kernel: sharp.kernel.nearest,
					fit: 'inside'
				}).toBuffer((err, buffer) => {
					if (err) { res.send('erreur'); return false }
					fs.writeFile(chemin, buffer, function() {
						res.json({ image: fichier.filename, alt: alt })
					})
				})
			} else {
				sharp(chemin).withMetadata().resize(1000, 1000, {
					kernel: sharp.kernel.nearest,
					fit: 'inside'
				}).toBuffer((err, buffer) => {
					if (err) { res.send('erreur'); return false }
					fs.writeFile(chemin, buffer, function() {
						res.json({ image: fichier.filename, alt: alt })
					})
				})
			}
		})
	}
})

app.post('/api/dupliquer-images', function (req, res) {
	const code = req.body.code
	const images = req.body.images
	images.forEach(function (image) {
		if (fs.existsSync(path.join(__dirname, '..', '/static/fichiers/' + code + '/' + image))) {
			fs.copySync(path.join(__dirname, '..', '/static/fichiers/' + code + '/' + image), path.join(__dirname, '..', '/static/fichiers/' + code + '/dup-' + image))
		}
	})
	res.send('images_dupliquees')
})

app.post('/api/televerser-media', function (req, res) {
	const identifiant = req.session.identifiant
	if (!identifiant) {
		res.send('non_autorise')
	} else {
		televerser(req, res, function () {
			const fichier = req.file
			const info = path.parse(fichier.originalname)
			const alt = info.name
			const extension = info.ext.toLowerCase()
			const code = req.body.code
			const chemin = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + fichier.filename)
			if (extension === '.jpg' || extension === '.jpeg') {
				sharp(chemin).withMetadata().rotate().jpeg().resize(1000, 1000, {
					kernel: sharp.kernel.nearest,
					fit: 'inside'
				}).toBuffer((err, buffer) => {
					if (err) { res.send('erreur'); return false }
					fs.writeFile(chemin, buffer, function() {
						res.json({ fichier: fichier.filename, alt: alt, type: 'image' })
					})
				})
			} else if (extension === '.png' || extension === '.gif') {
				sharp(chemin).withMetadata().resize(1000, 1000, {
					kernel: sharp.kernel.nearest,
					fit: 'inside'
				}).toBuffer((err, buffer) => {
					if (err) { res.send('erreur'); return false }
					fs.writeFile(chemin, buffer, function() {
						res.json({ fichier: fichier.filename, alt: alt, type: 'image' })
					})
				})
			} else {
				res.json({ fichier: fichier.filename, alt: alt, type: 'audio' })
			}
		})
	}
})

app.post('/api/supprimer-fichiers', function (req, res) {
	const code = req.body.code
	const fichiers = req.body.fichiers
	fichiers.forEach(function (fichier) {
		supprimerFichier(code, fichier)
	})
	res.send('fichiers_supprimes')
})

app.use(nuxt.render)

server.listen(port, host)

io.on('connection', function (socket) {
	socket.on('connexion', function (donnees) {
		const code = donnees.code
		const identifiant = donnees.identifiant
		const nom = donnees.nom
		socket.join(code)
		socket.identifiant = identifiant
		socket.nom = nom
		const clients = Object.keys(io.sockets.adapter.rooms[code].sockets)
		const utilisateurs = []
		for (let client of clients) {
			client = io.sockets.connected[client]
			utilisateurs.push({ identifiant: client.identifiant, nom: client.nom })
		}
		io.in(code).emit('connexion', utilisateurs)
	})

	socket.on('deconnexion', function (code) {
		ipUtilisateurs.delete(socket.handshake.session.identifiant)
		socket.to(code).emit('deconnexion', socket.handshake.session.identifiant)
	})

	socket.on('interactionouverte', function (donnees) {
		socket.to(donnees.code).emit('interactionouverte', donnees)
	})

	socket.on('interactionenattente', function (code, donnees) {
		socket.to(code).emit('interactionenattente', donnees)
	})

	socket.on('interactionverrouillee', function (code) {
		socket.to(code).emit('interactionverrouillee')
	})

	socket.on('interactiondeverrouillee', function (code) {
		socket.to(code).emit('interactiondeverrouillee')
	})

	socket.on('interactionfermee', function (code) {
		socket.to(code).emit('interactionfermee')
	})

	socket.on('nuageaffiche', function (code) {
		socket.to(code).emit('nuageaffiche')
	})

	socket.on('nuagemasque', function (code) {
		socket.to(code).emit('nuagemasque')
	})

	socket.on('questionsuivante', function (donnees) {
		socket.to(donnees.code).emit('questionsuivante', donnees)
	})

	socket.on('classement', function (code, donnees) {
		socket.to(code).emit('classement', donnees)
	})

	socket.on('modifiernom', function (donnees) {
		socket.to(donnees.code).emit('modifiernom', donnees)
		socket.handshake.session.nom = donnees.nom
		socket.handshake.session.save()
	})

	socket.on('reponse', function (reponse) {
		const code = parseInt(reponse.code)
		const session = parseInt(reponse.session)
		db.exists('interactions:' + code, function (err, donnees) {
			if (err) { socket.emit('erreur'); return false }
			if (donnees === 1) {
				db.hgetall('interactions:' + code, function (err, resultat) {
					if (err) { socket.emit('erreur'); return false }
					const type = resultat.type
					let reponses = JSON.parse(resultat.reponses)
					if (!reponses[session]) {
						reponses[session] = []
					}
					if (type === 'Sondage') {
						if (reponses[session].map(function (e) { return e.identifiant }).includes(reponse.donnees.identifiant) === true) {
							reponses[session].forEach(function (item) {
								if (item.identifiant === reponse.donnees.identifiant) {
									item.reponse = reponse.donnees.reponse
									if (item.nom !== reponse.donnees.nom && reponse.donnees.nom !== '') {
										item.nom = reponse.donnees.nom
									}
								}
							})
						} else {
							reponses[session].push(reponse.donnees)
						}
					} else if (type === 'Questionnaire') {
						if (reponses[session].map(function (e) { return e.identifiant }).includes(reponse.donnees.identifiant) === true) {
							reponses[session].forEach(function (item) {
								if (item.identifiant === reponse.donnees.identifiant) {
									item.reponse = reponse.donnees.reponse
									if (reponse.donnees.hasOwnProperty('temps')) {
										item.temps = reponse.donnees.temps
									}
									if (item.nom !== reponse.donnees.nom && reponse.donnees.nom !== '') {
										item.nom = reponse.donnees.nom
									}
								}
							})
						} else {
							reponses[session].push(reponse.donnees)
						}
					} else if (type === 'Remue-méninges' || type === 'Nuage-de-mots') {
						reponses[session].push(reponse.donnees)
					}
					db.hset('interactions:' + code, 'reponses', JSON.stringify(reponses), function (err) {
						if (err) { socket.emit('erreur'); return false }
						socket.to(code).emit('reponse', reponse)
						socket.emit('reponseenvoyee', reponse)
						socket.emit('reponses', { code: reponse.code, session: reponse.session, reponses: reponses[session] })
						socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
						socket.handshake.session.save()
					})
				})
			} else {
				socket.emit('erreurcode'); return false
			}
		})
	})

	socket.on('supprimermessage', function (donnees) {
		const code = parseInt(donnees.code)
		const session = parseInt(donnees.session)
		const id = donnees.id
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, resultat) {
					if (err) { socket.emit('erreur'); return false }
					let reponses = JSON.parse(resultat.reponses)
					if (reponses[session]) {
						reponses[session].forEach(function (item) {
							if (item.reponse.id === id) {
								item.reponse.visible = false
							}
						})
						db.hset('interactions:' + code, 'reponses', JSON.stringify(reponses), function (err) {
							if (err) { socket.emit('erreur'); return false }
							io.in(code).emit('reponses', { code: donnees.code, session: donnees.session, reponses: reponses[session] })
						})
					}
				})
			} else {
				socket.emit('erreurcode'); return false
			}
		})
	})

	socket.on('reorganisermessages', function (donnees) {
		const code = parseInt(donnees.code)
		const session = parseInt(donnees.session)
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, resultat) {
					if (err) { socket.emit('erreur'); return false }
					let reponses = JSON.parse(resultat.reponses)
					if (reponses[session]) {
						reponses[session] = donnees.reponses
						db.hset('interactions:' + code, 'reponses', JSON.stringify(reponses), function (err) {
							if (err) { socket.emit('erreur'); return false }
							io.in(code).emit('reponses', { code: donnees.code, session: donnees.session, reponses: reponses[session] })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					}
				})
			} else {
				socket.emit('erreurcode'); return false
			}
		})
	})

	socket.on('modifiercouleurmot', function (donnees) {
		const code = parseInt(donnees.code)
		const session = parseInt(donnees.session)
		const mot = donnees.mot
		const couleur = donnees.couleur
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, resultat) {
					if (err) { socket.emit('erreur'); return false }
					let reponses = JSON.parse(resultat.reponses)
					if (reponses[session]) {
						reponses[session].forEach(function (item) {
							if (item.reponse.texte === mot) {
								item.reponse.couleur = couleur
							}
						})
						db.hset('interactions:' + code, 'reponses', JSON.stringify(reponses), function (err) {
							if (err) { socket.emit('erreur'); return false }
							io.in(code).emit('modifiercouleurmot', { code: donnees.code, session: donnees.session, mot: donnees.mot, couleur: donnees.couleur })
							socket.handshake.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.handshake.session.save()
						})
					}
				})
			} else {
				socket.emit('erreurcode'); return false
			}
		})
	})

	socket.on('supprimermot', function (donnees) {
		const code = parseInt(donnees.code)
		const session = parseInt(donnees.session)
		const mot = donnees.mot
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, resultat) {
					if (err) { socket.emit('erreur'); return false }
					let reponses = JSON.parse(resultat.reponses)
					if (reponses[session]) {
						reponses[session].forEach(function (item) {
							if (item.reponse.texte === mot) {
								item.reponse.visible = false
							}
						})
						db.hset('interactions:' + code, 'reponses', JSON.stringify(reponses), function (err) {
							if (err) { socket.emit('erreur'); return false }
							io.in(code).emit('reponses', { code: donnees.code, session: donnees.session, reponses: reponses[session] })
						})
					}
				})
			} else {
				socket.emit('erreurcode'); return false
			}
		})
	})

	socket.on('supprimermots', function (donnees) {
		const code = parseInt(donnees.code)
		const session = parseInt(donnees.session)
		const mots = donnees.mots
		db.exists('interactions:' + code, function (err, reponse) {
			if (err) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				db.hgetall('interactions:' + code, function (err, resultat) {
					if (err) { socket.emit('erreur'); return false }
					let reponses = JSON.parse(resultat.reponses)
					if (reponses[session]) {
						reponses[session].forEach(function (item) {
							if (mots.includes(item.reponse.texte) === true) {
								item.reponse.visible = false
							}
						})
						db.hset('interactions:' + code, 'reponses', JSON.stringify(reponses), function (err) {
							if (err) { socket.emit('erreur'); return false }
							io.in(code).emit('reponses', { code: donnees.code, session: donnees.session, reponses: reponses[session] })
						})
					}
				})
			} else {
				socket.emit('erreurcode'); return false
			}
		})
	})

	socket.on('modifierlangue', function (langue) {
		socket.handshake.session.langue = langue
		socket.handshake.session.save()
	})
})

function creerMotDePasse () {
	let motdepasse = ''
	const lettres = 'abcdefghijklmnopqrstuvwxyz'
	for (let i = 0; i < 4; i++) {
		motdepasse += lettres.charAt(Math.floor(Math.random() * 26))
	}
	return motdepasse
}

function formaterDate (date, mot, langue) {
	let dateFormattee = ''
	switch (langue) {
		case 'fr':
			dateFormattee = mot + ' le ' + date
			break
		case 'en':
			dateFormattee = mot + ' on ' + date
			break
		case 'es':
			dateFormattee = mot + ' el ' + date
			break
	}
	return dateFormattee
}

function definirStatistiquesSondage (items, reponses) {
	const personnes = []
	const pourcentages = []
	for (let i = 0; i < items.length; i++) {
		personnes.push(0)
		pourcentages.push(0)
	}
	items.forEach(function (item, index) {
		let total = 0
		let nombreReponses = 0
		reponses.forEach(function (donnees) {
			donnees.reponse.forEach(function (reponse) {
				if (reponse === item.texte || reponse === item.image) {
					nombreReponses++
				}
				total++
			})
		})
		if (nombreReponses > 0) {
			personnes[index] = nombreReponses
			const pourcentage = (nombreReponses / total) * 100
			pourcentages[index] = Math.round(pourcentage)
		}
	})
	return { personnes: personnes, pourcentages: pourcentages }
}

function definirMessagesRemueMeninges (categories, reponses) {
	const messagesVisibles = []
	const messagesSupprimes = []
	for (let i = 0; i < categories.length; i++) {
		messagesVisibles.push([])
		messagesSupprimes.push([])
	}
	if (messagesVisibles.length > 0) {
		reponses.forEach(function (item) {
			let index = -1
			categories.forEach(function (categorie, indexCategorie) {
				if (item.reponse.categorie === categorie.texte || item.reponse.categorie === categorie.image) {
					index = indexCategorie
				}
			})
			if (item.reponse.visible && index > -1) {
				messagesVisibles[index].push(item)
			} else if (index > -1) {
				messagesSupprimes[index].push(item)
			}
		})
	} else {
		reponses.forEach(function (item) {
			if (item.reponse.visible) {
				messagesVisibles.push(item)
			} else {
				messagesSupprimes.push(item)
			}
		})
	}
	return { visibles: messagesVisibles, supprimes: messagesSupprimes }
}

function definirMotsNuageDeMots (reponses) {
	const messagesVisibles = []
	const messagesSupprimes = []
	reponses.forEach(function (item) {
		if (item.reponse.visible) {
			messagesVisibles.push(item)
		} else {
			messagesSupprimes.push(item)
		}
	})
	return { visibles: messagesVisibles, supprimes: messagesSupprimes }
}

function definirStatistiquesQuestions (questions, reponses) {
	const statistiques = []
	questions.forEach(function (question, indexQuestion) {
		const personnes = []
		const pourcentages = []
		for (let i = 0; i < question.items.length; i++) {
			personnes.push(0)
			pourcentages.push(0)
		}
		question.items.forEach(function (item, index) {
			let total = 0
			let nombreReponses = 0
			reponses.forEach(function (donnees) {
				donnees.reponse[indexQuestion].forEach(function (reponse) {
					if (reponse === item.texte || reponse === item.image) {
						nombreReponses++
					}
				})
				total++
			})
			if (nombreReponses > 0) {
				personnes[index] = nombreReponses
				const pourcentage = (nombreReponses / total) * 100
				pourcentages[index] = Math.round(pourcentage)
			}
		}.bind(this))
		statistiques.push({ personnes: personnes, pourcentages: pourcentages })
	}.bind(this))
	return statistiques
}

function definirReponses (reponses, indexQuestion) {
	let total = 0
	reponses.forEach(function (item) {
		if (item.hasOwnProperty('reponse') && item.reponse[indexQuestion].length > 0) {
			total++
		}
	})
	return total
}

function genererMotDePasse (longueur) {
	function rand (max) {
		return Math.floor(Math.random() * max)
	}
	function verifierMotDePasse (motdepasse, regex, caracteres) {
		if (!regex.test(motdepasse)) {
			const nouveauCaractere = caracteres.charAt(rand(caracteres.length))
			const position = rand(motdepasse.length + 1)
			motdepasse = motdepasse.slice(0, position) + nouveauCaractere + motdepasse.slice(position)
		}
		return motdepasse
	}
	let caracteres = '123456789abcdefghijklmnopqrstuvwxyz'
	const caracteresSpeciaux = '!#$@*'
	const specialRegex = /[!#\$@*]/
	const majuscules = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	const majusculesRegex = /[A-Z]/

	caracteres = caracteres.split('')
	let motdepasse = ''
	let index

	while (motdepasse.length < longueur) {
		index = rand(caracteres.length)
		motdepasse += caracteres[index]
		caracteres.splice(index, 1)
	}
	motdepasse = verifierMotDePasse(motdepasse, specialRegex, caracteresSpeciaux)
	motdepasse = verifierMotDePasse(motdepasse, majusculesRegex, majuscules)
	return motdepasse  
}

function verifierEmail (email) {
	const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi
	return regexExp.test(email)
}

const televerser = multer({
	storage: multer.diskStorage({
		destination: function (req, fichier, callback) {
			const code = req.body.code
			const chemin = path.join(__dirname, '..', '/static/fichiers/' + code + '/')
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

function recupererDonnees (identifiant) {
	const donneesInteractionsCreees = new Promise(function (resolveMain) {
		db.smembers('interactions-creees:' + identifiant, function (err, interactions) {
			const donneeInteractions = []
			if (err) { resolveMain(donneeInteractions) }
			for (const interaction of interactions) {
				const donneeInteraction = new Promise(function (resolve) {
					db.hgetall('interactions:' + interaction, function (err, donnees) {
						if (err) { resolve({}) }
						resolve(donnees)
					})
				})
				donneeInteractions.push(donneeInteraction)
			}
			Promise.all(donneeInteractions).then(function (resultat) {
				resolveMain(resultat)
			})
		})
	})
	return Promise.all([donneesInteractionsCreees])
}

function supprimerFichier (code, fichier) {
	const chemin = path.join(__dirname, '..', '/static/fichiers/' + code + '/' + fichier)
	if (fs.existsSync(chemin)) {
		fs.removeSync(chemin)
	}
}
