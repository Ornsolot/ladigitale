import Vue from 'vue'
import VueSocketIO from 'vue-socket.io'

export default ({ store }) => {
	Vue.use(new VueSocketIO({
		debug: false,
		connection: store.state.hote
	}))
}
