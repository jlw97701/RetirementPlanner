import { useCollapse } from 'react-collapsed';
import { ChevronLeft, Info } from 'lucide-react';
import { Popover } from './Popover';
import { useEffect, useState } from 'react';

export function CollapsiblePanel({
  title,
  subtitle,
  icon,
  info,
  expandRequestKey,
  children
}: {
  title: string;
  subtitle?: string;
  icon?: any;
  info?: string;
  expandRequestKey?: string | number;
  children?: any;
}) {
  const [isExpanded, setExpanded] = useState(true);
  const { getCollapseProps, getToggleProps } = useCollapse({ isExpanded });

  useEffect(() => {
    if (expandRequestKey !== undefined) setExpanded(true);
  }, [expandRequestKey]);

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
          <span className="collapsible-subtitle">{subtitle}</span>
          <span className={`collapsible-icon ${isExpanded ? 'rotated' : ''}`}>
            <ChevronLeft />
          </span>
        </button>
      </div>
      <section {...getCollapseProps()}>{children}</section>
    </div>
  );
}
