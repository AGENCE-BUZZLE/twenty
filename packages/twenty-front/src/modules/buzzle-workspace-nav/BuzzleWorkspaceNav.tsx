import { styled } from '@linaria/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IconChartBar,
  IconHome,
  IconReceipt,
  IconUsers,
} from 'twenty-ui/icon';

// Fixed Buzzle drawer nav (client-side). Pipeline and Mon profil are
// intentionally absent: the pipeline lives inside the Contacts view via
// status filtering, and profile settings live under the workspace
// dropdown "Parametres" entry.

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 8px;
  margin-bottom: 20px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13.5px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.82);
  transition: background 0.1s, color 0.1s;
  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #ffffff;
  }
`;

const IconWrap = styled.span`
  opacity: 0.72;
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
`;

type NavItem = {
  label: string;
  Icon: (props: { size?: number }) => JSX.Element;
  path: string;
};

const items: NavItem[] = [
  { label: "Vue d'ensemble", Icon: IconHome, path: '/overview' },
  { label: 'Contacts', Icon: IconUsers, path: '/contacts' },
  { label: 'Rapports', Icon: IconChartBar, path: '/reports' },
  { label: 'Factures', Icon: IconReceipt, path: '/invoices' },
];

const activeStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.12)',
  color: '#ffffff',
  fontWeight: 500,
};

const activeIconStyle: React.CSSProperties = {
  opacity: 1,
  color: '#ffffff',
};

export const BuzzleWorkspaceNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (path: string) => {
    navigate(path);
  };

  const renderItem = (item: NavItem) => {
    // Consider a nav item active when the current path starts with it,
    // so /objects/contacts still keeps "Contacts" highlighted when the
    // scaffold redirects to the native record index (temporary during
    // the migration to the custom BuzzleContactsPage).
    const isActive =
      item.path === '/overview'
        ? location.pathname === '/overview' || location.pathname === '/'
        : location.pathname.startsWith(item.path) ||
          (item.path === '/contacts' &&
            location.pathname.startsWith('/objects/contacts'));
    const IconCmp = item.Icon;

    return (
      <Item
        key={item.path}
        style={isActive ? activeStyle : undefined}
        onClick={() => handleClick(item.path)}
      >
        <IconWrap style={isActive ? activeIconStyle : undefined}>
          <IconCmp size={15} />
        </IconWrap>
        {item.label}
      </Item>
    );
  };

  return (
    <Section>{items.map(renderItem)}</Section>
  );
};
