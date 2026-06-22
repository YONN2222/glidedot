<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
navigateTo(`/projects/${route.params.id}/structure`)
</script>