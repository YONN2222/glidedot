import type { Project } from "~/types/project"

import { unref } from 'vue'

import type { Ref } from 'vue'

export const useProject = (projectsRef: Ref<Project[]> | Project[]) => {
    const route = useRoute()

    const currentProject = computed(() => {
        const id = route.params.id
        if (!id) return null
        const projectsList = unref(projectsRef) || []
        return projectsList.find((p: Project) => String(p.id) === String(id)) || null
    })

    return {currentProject}
}