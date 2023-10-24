<template>
	<div id="app">
		<transition name="fondu">
			<nuxt v-if="!chargement" />
		</transition>

		<div id="alerte" class="conteneur-modale alerte" v-if="alerte !== ''" @click="reinitialiserAlerte">
			<div id="message" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<div class="message" v-html="alerte" />
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="reinitialiserAlerte">{{ $t('fermer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Base',
	data () {
		return {
			chargement: true
		}
	},
	computed: {
		userAgent () {
			return this.$store.state.userAgent
		},
		alerte () {
			return this.$store.state.alerte
		},
		message () {
			return this.$store.state.message
		}
	},
	watch: {
		message: function (message) {
			if (message !== '') {
				const element = document.createElement('div')
				const id = 'notification_' + Date.now().toString(36) + Math.random().toString(36).substring(2)
				element.id = id
				element.textContent = message
				element.classList.add('notification')
				document.querySelector('#app').appendChild(element)
				this.$store.dispatch('modifierMessage', '')
				setTimeout(function () {
					element.parentNode.removeChild(element)
				}, 2500)
			}
		}
	},
	mounted () {
		this.chargement = false
	},
	methods: {
		reinitialiserAlerte () {
			this.$store.dispatch('modifierAlerte', '')
		}
	}
}
</script>
