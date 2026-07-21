import { useCollapse } from 'react-collapsed';
import { ChevronLeft, Info } from 'lucide-react';
import { Popover } from './Popover';

export function AccordionPanel({
  title,
  icon,
  info,
  isOpen = true,
  children, // content
  onToggle
}: {
  title: string;
  icon?: any;
  info?: string;
  isOpen?: boolean;
  children?: any;
  onToggle?: (v: any) => void;
}) {
  const { getCollapseProps, getToggleProps } = useCollapse({
    isExpanded: isOpen
  });

  return (
    <div className="accordion-panel panel">
      <div className="collapsible" {...getToggleProps({ onClick: onToggle })}>
        <h2>
          {icon} <span className="collapsible-title">{title}</span>
        </h2>
        {info && (
          <Popover trigger={<Info />} html={info} />
        )}
        <button className="collapsible-button">
          <span className={`collapsible-icon ${isOpen ? 'rotated' : ''}`}>
            <ChevronLeft />
          </span>
        </button>
      </div>
      <section {...getCollapseProps()}>{children}</section>
    </div>
  );
}
