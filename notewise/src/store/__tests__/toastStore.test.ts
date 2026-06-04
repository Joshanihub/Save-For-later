import useToastStore from '../toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with empty toasts', () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('should add a toast with default type "info"', () => {
    useToastStore.getState().showToast('Hello');
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Hello');
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].id).toBeDefined();
  });

  it('should add a toast with explicit type', () => {
    useToastStore.getState().showToast('Success!', 'success');
    expect(useToastStore.getState().toasts[0].type).toBe('success');
  });

  it('should add an error toast', () => {
    useToastStore.getState().showToast('Error!', 'error');
    expect(useToastStore.getState().toasts[0].type).toBe('error');
  });

  it('should auto-remove toast after 3 seconds', () => {
    useToastStore.getState().showToast('Temporary');
    expect(useToastStore.getState().toasts).toHaveLength(1);

    jest.advanceTimersByTime(3000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should manually remove a toast', () => {
    useToastStore.getState().showToast('Manual remove');
    const id = useToastStore.getState().toasts[0].id;

    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should support multiple toasts simultaneously', () => {
    useToastStore.getState().showToast('First');
    useToastStore.getState().showToast('Second');
    useToastStore.getState().showToast('Third');
    expect(useToastStore.getState().toasts).toHaveLength(3);
  });

  it('should only remove the matching toast on timeout, not others', () => {
    useToastStore.getState().showToast('First');

    jest.advanceTimersByTime(1500);
    useToastStore.getState().showToast('Second');

    // 1500ms later: first toast has lived 3000ms total, should be gone
    jest.advanceTimersByTime(1500);
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Second');
  });

  it('removeToast should not crash on non-existent id', () => {
    useToastStore.getState().removeToast('non-existent');
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
