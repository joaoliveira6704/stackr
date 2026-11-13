<!-- Soft blurred colour behind every page. Glass panels are see-through, so
without something colourful underneath they would look flat and grey. The
lights are placed along the whole page and scroll with it, so long pages get
colour all the way down. -->
<template>
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
		<div class="orb -top-40 -left-32 size-[34rem] bg-brand" />
		<div class="orb top-[22%] -right-40 size-[30rem] bg-grape" />
		<div class="orb top-[52%] -left-40 size-[30rem] bg-brand" />
		<div class="orb -bottom-48 left-1/4 size-[28rem] bg-tangerine" />
	</div>
</template>
