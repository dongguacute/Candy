import gsap from 'gsap';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

export type GsapModalHandle = {
  close: () => void;
};

type GsapModalProps = {
  children: React.ReactNode;
  onCloseComplete: () => void;
  panelClassName?: string;
  closeOnBackdrop?: boolean;
};

export const GsapModal = forwardRef<GsapModalHandle, GsapModalProps>(function GsapModal(
  { children, onCloseComplete, panelClassName = '', closeOnBackdrop = true },
  ref
) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) {
      closingRef.current = false;
      onCloseComplete();
      return;
    }
    gsap
      .timeline({
        onComplete: () => {
          closingRef.current = false;
          onCloseComplete();
        },
      })
      .to(panel, { opacity: 0, y: 20, scale: 0.94, duration: 0.24, ease: 'power2.in' }, 0)
      .to(backdrop, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0);
  }, [onCloseComplete]);

  useImperativeHandle(ref, () => ({ close: handleClose }), [handleClose]);

  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) return;
    gsap.set(backdrop, { opacity: 0 });
    gsap.set(panel, { opacity: 0, y: 28, scale: 0.92 });
    const ctx = gsap.context(() => {
      gsap.to(backdrop, { opacity: 1, duration: 0.26, ease: 'power2.out' });
      gsap.to(panel, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        ref={backdropRef}
        role="presentation"
        className="absolute inset-0 bg-yellow-950/20 backdrop-blur-sm"
        onClick={closeOnBackdrop ? handleClose : undefined}
      />
      <div ref={panelRef} className={`relative z-10 w-full min-h-0 ${panelClassName}`}>
        {children}
      </div>
    </div>
  );
});
