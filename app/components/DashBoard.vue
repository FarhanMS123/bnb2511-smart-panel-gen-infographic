<template>
  <div class="dash-board w-full h-full relative bg-white">
    <!-- Dynamic components will be rendered here -->
    <div class="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="(comp, index) in components" :key="index" class="component-wrapper border rounded-lg p-4 shadow-sm">
        <component :is="comp.is" v-bind="comp.props" />
      </div>
    </div>
    
    <!-- Placeholder for empty state -->
    <div v-if="components.length === 0" class="flex items-center justify-center h-full text-gray-400">
      <p>Listening for commands...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const components = ref<any[]>([])

// Helper to load script
const loadScript = (src: string) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.type = 'module'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

// Expose method to add components (will be used by parent/store later)
const addComponent = async (componentData: any) => {
  if (componentData.scriptUrl) {
    try {
      await loadScript(componentData.scriptUrl)
    } catch (e) {
      console.error(e)
      return // Don't add if script fails
    }
  }
  components.value.push(componentData)
}

defineExpose({
  addComponent
})
</script>

<style scoped>
.dash-board {
  /* Ensure it takes full space */
  min-height: 100vh;
}
</style>
