import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose?: () => void;
  label: string;
  backdrop?: boolean;
  children?: ReactNode;
}

/** Wrapper around the native <dialog>. Children are mounted only while the dialog is open. */
export default function Dialog({ open, onClose, label, backdrop, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  // Layout effect avoids a frame with an empty dialog when closing
  useLayoutEffect(() => {
    const d = ref.current!;
    if (open && !d.open) { document.documentElement.classList.add('is-scroll-locked'); d.showModal(); }
    if (!open && d.open) d.close();
  }, [open]);

  // Native close (Escape, backdrop click) must be mirrored back into React state
  useEffect(() => {
    const d = ref.current!;
    const h = () => {
      onClose?.();
      if (!document.querySelector('dialog[open]')) document.documentElement.classList.remove('is-scroll-locked');
    };
    d.addEventListener('close', h);
    return () => d.removeEventListener('close', h);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={label}
      onClick={backdrop ? e => { if (e.target === ref.current) onClose?.(); } : undefined}
    >
      {open ? children : null}
    </dialog>
  );
}
