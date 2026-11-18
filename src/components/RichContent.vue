<template>
  <div v-if="content" class="prose prose-sm max-w-none text-gray-700 leading-relaxed">
    <!-- Handle string content (plain text) -->
    <template v-if="typeof content === 'string'">
      <p>{{ content }}</p>
    </template>

    <!-- Handle Tiptap JSON -->
    <template v-else-if="content.type === 'doc'">
      <div v-for="(node, idx) in content.content" :key="idx">
        <!-- Paragraph -->
        <p v-if="node.type === 'paragraph'" class="mb-2" :class="{ 'font-bold': hasMark(node, 'bold'), 'italic': hasMark(node, 'italic'), 'underline': hasMark(node, 'underline') }">
          <template v-if="node.content">
            <template v-for="(tc, tidx) in node.content" :key="tidx">
              {{ tc.text }}
            </template>
          </template>
        </p>

        <!-- Heading -->
        <h1 v-else-if="node.type === 'heading' && node.attrs?.level === 1" class="text-xl font-bold mb-3 text-gray-900">
          {{ getText(node) }}
        </h1>
        <h2 v-else-if="node.type === 'heading' && node.attrs?.level === 2" class="text-lg font-semibold mb-2 text-gray-900">
          {{ getText(node) }}
        </h2>

        <!-- Bullet List -->
        <ul v-else-if="node.type === 'bulletList'" class="list-disc list-inside mb-2 space-y-1">
          <li v-for="(item, i) in node.content" :key="i">{{ getText(item) }}</li>
        </ul>

        <!-- Ordered List -->
        <ol v-else-if="node.type === 'orderedList'" class="list-decimal list-inside mb-2 space-y-1">
          <li v-for="(item, i) in node.content" :key="i">{{ getText(item) }}</li>
        </ol>

        <!-- Blockquote -->
        <blockquote v-else-if="node.type === 'blockquote'" class="border-l-4 border-gray-300 pl-3 italic text-gray-500 my-2">
          {{ getText(node) }}
        </blockquote>

        <!-- Image -->
        <div v-else-if="node.type === 'image'" class="rounded-lg my-2 overflow-hidden bg-gray-100">
          <img :src="node.attrs?.src" class="max-w-full" />
        </div>

        <!-- Horizontal Rule -->
        <hr v-else-if="node.type === 'horizontalRule'" class="my-4 border-gray-200" />

        <!-- Line Break -->
        <br v-else-if="node.type === 'hardBreak'" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{ content: any }>()

function getText(node: any): string {
  if (!node) return ''
  if (node.text) return node.text
  if (node.content) return node.content.map(getText).join(' ')
  return ''
}

function hasMark(node: any, markType: string): boolean {
  return node.marks?.some((m: any) => m.type === markType) || false
}
</script>
