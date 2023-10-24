<template>
	<div id="conteneur-chargement" v-if="chargement">
		<div id="chargement">
			<div class="spinner">
				<div />
				<div />
				<div />
				<div />
				<div />
				<div />
				<div />
				<div />
				<div />
				<div />
				<div />
				<div />
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Chargement',
	props: {
		chargement: Boolean
	}
}
</script>

<style scoped>
#conteneur-chargement {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100%;
	height: 100%;
	z-index: 100000;
}

#chargement {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
}
</style>
