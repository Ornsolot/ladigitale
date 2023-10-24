<template>
	<div id="app">
		<transition name="fondu">
			<nuxt v-if="!chargement" />
		</transition>

		<div id="conteneur-message" class="conteneur-modale" v-if="message">
			<div id="message" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<div class="message" v-html="message" />
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="reinitialiserMessage">{{ $t('fermer') }}</span>
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
		message () {
			return this.$store.state.message
		},
		notification () {
			return this.$store.state.notification
		}
	},
	watch: {
		notification: function (notification) {
			if (notification !== '') {
				const element = document.createElement('div')
				const id = 'notification_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
				element.id = id
				element.textContent = notification
				element.classList.add('notification')
				document.querySelector('#app').appendChild(element)
				this.$store.dispatch('modifierNotification', '')
				setTimeout(function () {
					element.parentNode.removeChild(element)
				}, 2000)
			}
		}
	},
	mounted () {
		this.chargement = false
	},
	methods: {
		reinitialiserMessage () {
			this.$store.dispatch('modifierMessage', '')
		}
	}
}
</script>
