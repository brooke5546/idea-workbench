import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../views/HomeView.vue') },
  { path: '/cards/new', component: () => import('../views/CardEditorView.vue') },
  { path: '/cards/:id', component: () => import('../views/CardDetailView.vue') },
  { path: '/cards/:id/edit', component: () => import('../views/CardEditorView.vue') },
  { path: '/tags', component: () => import('../views/TagsView.vue') },
  { path: '/tags/:tagId', component: () => import('../views/TagCardsView.vue') },
  { path: '/search', component: () => import('../views/SearchView.vue') },
  { path: '/me', component: () => import('../views/MeView.vue') },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
