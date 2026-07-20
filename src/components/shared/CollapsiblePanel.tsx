import { useCollapse } from 'react-collapsed';
import { ChevronLeft, Info } from 'lucide-react';
import { Popover } from './Popover';
import { useState } from 'react';

export function CollapsiblePanel({
  title,
  icon,
  info,
  children
}: {
  title: string;
  icon?: any;
  info?: string;
  children?: any;
}) {
  const [isExpanded, setExpanded] = useState(true);
  const { getCollapseProps, getToggleProps } = useCollapse({ isExpanded });

  return (
    <div className="collapsible-panel panel">
      <div
        className="collapsible"
        {...getToggleProps({
          onClick: () => setExpanded((prevExpanded) => !prevExpanded)
        })}>
        <h2>
          {icon} {title}
        </h2>
        {info && <Popover trigger={<Info />} html={info} />}
        <button className="collapsible-button">
          <span className={`collapsible-icon ${isExpanded ? 'rotated' : ''}`}>
            <ChevronLeft />
          </span>
        </button>
      </div>
      <section {...getCollapseProps()}>{children}</section>
    </div>
  );
}
