<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 max-w-md mx-auto">
    <div class="flex items-stretch">
      <router-link to="/" class="floating-tab" active-class="text-rose-500" inactive-class="text-gray-400">
        <span class="text-lg">🏠</span>
        <span>工作台</span>
      </router-link>
      <router-link to="/tags" class="floating-tab" active-class="text-rose-500" inactive-class="text-gray-400">
        <span class="text-lg">🔖</span>
        <span>标签</span>
      </router-link>
      <router-link to="/search" class="floating-tab" active-class="text-rose-500" inactive-class="text-gray-400">
        <span class="text-lg">🔍</span>
        <span>搜索</span>
      </router-link>
      <router-link to="/me" class="floating-tab" active-class="text-rose-500" inactive-class="text-gray-400">
        <span class="text-lg">👤</span>
        <span>我的</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import 'vue-router'
</script>
