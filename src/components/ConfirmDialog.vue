<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="show" class="modal-overlay">
        <div class="card modal-content confirm-dialog-content">
          <div v-if="danger" class="confirm-dialog-icon">⚠️</div>
          <h3 class="confirm-dialog-title">{{ title }}</h3>
          <p class="confirm-dialog-message">{{ message }}</p>
          <div class="confirm-dialog-actions">
            <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="btn"
              :class="danger ? 'confirm-dialog-danger-btn' : 'btn-primary'"
              @click="$emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmText: { type: String, required: true },
  cancelText: { type: String, required: true },
  danger: { type: Boolean, default: false }
});

defineEmits(['confirm', 'cancel']);

// Directive 2 (dialog-implementation rule): no @click.self on .modal-overlay here —
// this dialog closes only via the Cancel or Confirm button above.
</script>

<style scoped>
.confirm-dialog-content {
  max-width: 400px;
  text-align: center;
  padding: 2rem;
}

.confirm-dialog-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ef4444;
}

.confirm-dialog-title {
  margin-bottom: 1rem;
}

.confirm-dialog-message {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.confirm-dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.confirm-dialog-actions .btn {
  flex: 1;
}

.confirm-dialog-danger-btn {
  background: #dc2626;
  border-color: #dc2626;
  color: white;
}
</style>
