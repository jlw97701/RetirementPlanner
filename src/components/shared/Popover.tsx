import {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef
} from 'react';

export type PopoverPlacement = 'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end';

export interface PopoverHandle {
  show: () => void;
  hide: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /**
   * Element used to open and close the popover.
   *
   * A button is recommended for accessibility.
   */
  trigger: ReactNode;

  /** Popover contents. */
  children?: ReactNode;
  html?: string;

  /** Preferred position relative to the trigger. */
  placement?: PopoverPlacement;

  /** Distance between the trigger and popover, in pixels. */
  offset?: number;

  /**
   * Native popover behavior.
   *
   * "auto" provides light-dismiss and Escape handling.
   * "manual" must be dismissed programmatically.
   */
  mode?: 'auto' | 'manual';

  /** Optional externally supplied ID. */
  id?: string;

  /** Called whenever the native popover opens or closes. */
  onOpenChange?: (open: boolean) => void;

  /** Imperative API reference. */
  popoverRef?: Ref<PopoverHandle>;
}

type PopoverHTMLElement = HTMLDivElement & {
  showPopover(): void;
  hidePopover(): void;
  togglePopover(force?: boolean): boolean;
};

function supportsPopover(element: HTMLElement): element is PopoverHTMLElement {
  return 'showPopover' in element && 'hidePopover' in element && 'togglePopover' in element;
}

export function Popover({
  trigger,
  children,
  html,
  placement = 'bottom-start',
  offset = 8,
  mode = 'auto',
  id,
  onOpenChange,
  popoverRef,
  className,
  style,
  ...popoverProps
}: PopoverProps) {
  const generatedId = useId();
  const popoverId = id ?? `popover-${generatedId.replace(/:/g, '')}`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isOpen = useCallback(() => {
    return contentRef.current?.matches(':popover-open') ?? false;
  }, []);

  const updatePosition = useCallback(() => {
    const triggerElement = triggerRef.current;
    const popoverElement = contentRef.current;

    if (!triggerElement || !popoverElement || !isOpen()) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const popoverRect = popoverElement.getBoundingClientRect();

    let top = triggerRect.bottom + offset;
    let left = triggerRect.left;

    switch (placement) {
      case 'top-start':
        top = triggerRect.top - popoverRect.height - offset;
        left = triggerRect.left;
        break;

      case 'top':
        top = triggerRect.top - popoverRect.height - offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;

      case 'top-end':
        top = triggerRect.top - popoverRect.height - offset;
        left = triggerRect.right - popoverRect.width;
        break;

      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;

      case 'bottom-end':
        top = triggerRect.bottom + offset;
        left = triggerRect.right - popoverRect.width;
        break;

      case 'bottom-start':
      default:
        top = triggerRect.bottom + offset;
        left = triggerRect.left;
        break;
    }

    const viewportPadding = 8;

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - popoverRect.width - viewportPadding));

    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - popoverRect.height - viewportPadding));

    popoverElement.style.top = `${Math.round(top)}px`;
    popoverElement.style.left = `${Math.round(left)}px`;
  }, [isOpen, offset, placement]);

  const show = useCallback(() => {
    const element = contentRef.current;

    if (!element || !supportsPopover(element) || isOpen()) {
      return;
    }

    element.showPopover();

    // Position after the browser has displayed and measured the popover.
    requestAnimationFrame(updatePosition);
  }, [isOpen, updatePosition]);

  const hide = useCallback(() => {
    const element = contentRef.current;

    if (!element || !supportsPopover(element) || !isOpen()) {
      return;
    }

    element.hidePopover();
  }, [isOpen]);

  const toggle = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    if (isOpen()) {
      hide();
    } else {
      show();
    }
  }, [hide, isOpen, show]);

  useImperativeHandle(
    popoverRef,
    () => ({
      show,
      hide,
      toggle,
      isOpen
    }),
    [hide, isOpen, show, toggle]
  );

  useEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    /*
     * setAttribute is used for compatibility with React/TypeScript versions
     * whose JSX typings do not yet include the popover attribute.
     */
    element.setAttribute('popover', mode);

    return () => {
      element.removeAttribute('popover');
    };
  }, [mode]);

  useEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    const handleToggle = (e: Event) => {
      const toggleEvent = e as ToggleEvent;
      const open = toggleEvent.newState === 'open';

      triggerRef.current?.setAttribute('aria-expanded', String(open));
      onOpenChange?.(open);

      if (open) {
        requestAnimationFrame(updatePosition);
      }
    };

    element.addEventListener('toggle', handleToggle);

    return () => {
      element.removeEventListener('toggle', handleToggle);
    };
  }, [onOpenChange, updatePosition]);

  useEffect(() => {
    const handleViewportChange = () => {
      if (isOpen()) {
        updatePosition();
      }
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, updatePosition]);

  const popoverStyle: CSSProperties = {
    position: 'fixed',
    margin: 0,
    ...style
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-controls={popoverId}
        aria-expanded="false"
        aria-haspopup="dialog"
        onClick={toggle}
        className="popover-trigger">
        {trigger}
      </button>

      <div
        {...popoverProps}
        ref={contentRef}
        id={popoverId}
        className={['popover-content', className].filter(Boolean).join(' ')}
        style={popoverStyle}>
        {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : children}
      </div>
    </>
  );
}
