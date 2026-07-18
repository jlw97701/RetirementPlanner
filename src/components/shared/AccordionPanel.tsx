import { useCollapse } from 'react-collapsed';
import { Settings, ChevronLeft, Info } from 'lucide-react';
import { Popover } from './Popover';

export function AccordionPanel({
  title,
  info,
  children,
  isOpen,
  onToggle
}: {
  title: string;
  info?: string;
  children: any;
  isOpen: boolean;
  onToggle: (v: any) => void;
}) {
  const { getCollapseProps, getToggleProps } = useCollapse({
    isExpanded: isOpen
  });

  return (
    <div className="accordion-panel panel">
      <div className="collapsible" {...getToggleProps({ onClick: onToggle })}>
        <h2>
          <Settings /> {title}
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
      <div {...getCollapseProps()}>{children}</div>
    </div>
  );
}
