import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ConfirmDialog from './ConfirmDialog.vue';

describe('ConfirmDialog.vue', () => {
  it('renders nothing when show is false', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { show: false, title: 'Title', message: 'Message', confirmText: 'OK', cancelText: 'Cancel' }
    });
    expect(document.body.querySelector('.modal-overlay')).toBeNull();
    wrapper.unmount();
  });

  it('renders title, message, and button labels when show is true', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { show: true, title: 'Delete?', message: 'Are you sure?', confirmText: 'Delete', cancelText: 'Cancel' }
    });
    expect(document.body.textContent).toContain('Delete?');
    expect(document.body.textContent).toContain('Are you sure?');
    expect(document.body.textContent).toContain('Delete');
    expect(document.body.textContent).toContain('Cancel');
    wrapper.unmount();
  });

  it('never closes on overlay click — only emits confirm/cancel from its own buttons', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { show: true, title: 'Title', message: 'Message', confirmText: 'OK', cancelText: 'Cancel' }
    });

    const overlay = document.body.querySelector('.modal-overlay');
    overlay.dispatchEvent(new Event('click', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('cancel')).toBeUndefined();
    expect(wrapper.emitted('confirm')).toBeUndefined();

    wrapper.unmount();
  });

  it('emits cancel and confirm from their respective buttons', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { show: true, title: 'Title', message: 'Message', confirmText: 'OK', cancelText: 'Cancel' }
    });

    const buttons = document.body.querySelectorAll('.confirm-dialog-actions button');
    buttons[0].dispatchEvent(new Event('click', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    buttons[1].dispatchEvent(new Event('click', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('confirm')).toHaveLength(1);

    wrapper.unmount();
  });

  it('shows the warning icon only when danger is true', () => {
    const dangerWrapper = mount(ConfirmDialog, {
      props: { show: true, title: 'Title', message: 'Message', confirmText: 'OK', cancelText: 'Cancel', danger: true }
    });
    expect(document.body.querySelector('.confirm-dialog-icon')).not.toBeNull();
    dangerWrapper.unmount();

    const plainWrapper = mount(ConfirmDialog, {
      props: { show: true, title: 'Title', message: 'Message', confirmText: 'OK', cancelText: 'Cancel' }
    });
    expect(document.body.querySelector('.confirm-dialog-icon')).toBeNull();
    plainWrapper.unmount();
  });
});
