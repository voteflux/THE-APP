<template>
    <div>
        <h3>PDF: {{ title }} <small><a href="" target=""><fa-icon icon="save" />></a></small></h3>
        <iframe :src="pdf" style="min-height: 50vh; height: 50vh" width="100%" frameborder="0" />
    </div>
</template>
