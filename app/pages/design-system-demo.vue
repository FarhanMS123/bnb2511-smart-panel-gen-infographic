<template>
  <div class="p-8 bg-gray-100 min-h-screen">
    <h1 class="text-3xl font-bold mb-8 text-blue-600">Design System Demo</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Tailwind Section -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 border-b pb-2">Tailwind CSS</h2>
        <p class="mb-4 text-gray-600">
          This section uses standard Tailwind utility classes.
        </p>
        <div class="space-y-4">
          <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
            Tailwind Button
          </button>
          
          <div class="p-4 bg-green-100 text-green-800 rounded border border-green-200">
            Tailwind Alert Box
          </div>
        </div>
      </div>

      <!-- Vuetify Section -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 border-b pb-2">Vuetify (Material UI)</h2>
        <p class="mb-4 text-gray-600">
          This section uses Vuetify components.
        </p>
        <div class="space-y-4">
          <v-btn color="primary" elevation="2">
            Vuetify Button
          </v-btn>

          <v-card class="mt-4" variant="tonal" color="success">
            <v-card-text>
              Vuetify Card Component
            </v-card-text>
          </v-card>
          
          <v-slider label="Volume" thumb-label></v-slider>
        </div>
      </div>
    </div>

    <!-- Mixed Usage -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">Mixed Usage</h2>
      <p class="mb-4">
        Tailwind classes on Vuetify components:
      </p>
      <v-btn class="bg-purple-500 text-white font-bold py-2 px-4 rounded" flat>
        Vuetify Btn + Tailwind Classes
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
// No script needed for this demo
</script>
