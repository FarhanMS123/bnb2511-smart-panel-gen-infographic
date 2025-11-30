<template>
  <div class="h-screen w-screen bg-gray-50 relative overflow-hidden">
    <!-- Dash View (Background Layer) -->
    <div class="absolute inset-0 z-0">
      <DashBoard ref="dashboardRef" />
    </div>

    <!-- Main Content Area (Optional/Overlay) -->
    <div class="relative z-10 flex items-center justify-center h-full pointer-events-none">
      <!-- Content here would go above DashBoard but below Controls if needed, 
           but for now we keep it empty or minimal as requested. 
           pointer-events-none ensures clicks pass through to DashBoard if this covers it. -->
    </div>

    <!-- Floating Controls -->
    <FloatingControls @audio-recorded="handleAudio" />
  </div>
</template>

<script setup lang="ts">
import DashBoard from '~/components/DashBoard.vue'

const dashboardRef = ref()

const handleAudio = async (audioBlob: Blob) => {
  console.log('Audio recorded, sending to backend...', audioBlob)
  
  const formData = new FormData()
  formData.append('audio', audioBlob)

  try {
    const { data, error } = await useFetch('/api/chat', {
      method: 'POST',
      body: formData
    })

    if (error.value) {
      console.error('Error sending audio:', error.value)
      return
    }

    const response = data.value as any
    console.log('Received response from Gemini:', response)
    
    // Process response and add components to dashboard
    if (response && response.components) {
      response.components.forEach((comp: any) => {
        dashboardRef.value?.addComponent(comp)
      })
    }
  } catch (e) {
    console.error('Exception sending audio:', e)
  }
}
</script>

