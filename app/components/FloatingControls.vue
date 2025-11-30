<template>
  <div class="floating-controls">
    <!-- Settings Button -->
    <v-btn
      icon="mdi-cog"
      variant="outlined"
      color="grey-darken-1"
      class="settings-btn"
      size="small"
    ></v-btn>

    <!-- Pill Container -->
    <v-sheet class="pill-container" elevation="0" rounded="xl" border>
      <v-btn icon variant="text" size="small" color="grey-darken-3">
        <v-icon size="large">mdi-plus</v-icon>
      </v-btn>
      
      <v-btn icon variant="text" size="small" color="grey-darken-1">
        <v-icon>mdi-keyboard</v-icon>
      </v-btn>

      <div class="divider"></div>

      <v-btn 
        icon 
        variant="text" 
        size="small" 
        :color="isRecording ? 'red' : 'grey-darken-1'"
        @click="toggleRecording"
      >
        <v-icon>{{ isRecording ? 'mdi-stop' : 'mdi-microphone' }}</v-icon>
      </v-btn>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
const isRecording = ref(false)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

const emit = defineEmits(['audio-recorded'])

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      emit('audio-recorded', audioBlob)
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    isRecording.value = true
  } catch (error) {
    console.error('Error accessing microphone:', error)
  }
}

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
  }
}

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}
</script>

<style scoped>
.floating-controls {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
}

.settings-btn {
  background-color: white;
  border-color: #e0e0e0;
}

.pill-container {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 4px;
  height: 48px;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: #e0e0e0;
  margin: 0 4px;
}
</style>
