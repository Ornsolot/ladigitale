export default {
	methods: {
		definirReponse (event, indexQuestion) {
			if (this.questions[indexQuestion].option === 'choix-unique') {
				if (this.reponse[indexQuestion].length > 0) {
					this.reponse[indexQuestion].splice(0, 1)
				}
				this.reponse[indexQuestion].push(event.target.value)
			} else if (this.questions[indexQuestion].option === 'choix-multiples') {
				if (event.target.checked === true) {
					this.reponse[indexQuestion].push(event.target.value)
				} else {
					const index = this.reponse[indexQuestion].indexOf(event.target.value)
					this.reponse[indexQuestion].splice(index, 1)
				}
			}
		},
		modifierIndexQuestion () {
			this.$emit('index')
		},
		afficherMedia () {
			this.modale = 'media'
		},
		fermerModale () {
			this.modale = ''
		},
		afficherImage (event, image) {
			event.preventDefault()
			event.stopPropagation()
			this.image = image
			this.modale = 'image'
		},
		fermerModaleImage () {
			this.modale = ''
			this.image = ''
		}
	}
}
