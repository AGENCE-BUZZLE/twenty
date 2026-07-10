import { styled } from '@linaria/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IconChartBar,
  IconHome,
  IconMail,
  IconTrendingUp,
  IconUser,
  IconUsers,
} from 'twenty-ui/icon';

// Hardcoded Buzzle navigation shown at the top of the workspace nav drawer.
// Replaces Twenty's dynamic object-driven nav (which is filtered to hide
// all default objects). Renders a fixed set of Buzzle-specific pages that
// every workspace has: Contacts, Pipeline, Rapports + user account.
//
// NOTE: Linaria's runtime conditional interpolation is not supported by
// lightningcss (crashes at build time). We use static styled components
// + inline style overrides for dynamic states like isActive.

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 8px;
  margin-bottom: 20px;
`;

const Label = styled.div`
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #14141c;
  opacity: 0.5;
  padding: 6px 10px 4px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13.5px;
  cursor: pointer;
  color: #14141c;
  transition: background 0.1s;
  &:hover {
    background: #efede6;
  }
`;

const IconWrap = styled.span`
  opacity: 0.6;
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
  { label: 'Pipeline', Icon: IconTrendingUp, path: '/pipeline' },
  { label: 'Rapports', Icon: IconChartBar, path: '/reports' },
];

const accountItems: NavItem[] = [
  { label: 'Mon profil', Icon: IconUser, path: '/settings/profile' },
  {
    label: 'Contacter Buzzle',
    Icon: IconMail,
    path: 'mailto:contact@agence-buzzle.com',
  },
];

const activeStyle: React.CSSProperties = {
  background: '#14141c',
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
    if (path.startsWith('mailto:')) {
      window.location.href = path;

      return;
    }
    navigate(path);
  };

  const renderItem = (item: NavItem) => {
    // Consider a nav item active when the current path starts with it,
    // so /objects/contacts still keeps "Contacts" highlighted after
    // BuzzleContactsPage redirects.
    const isActive =
      item.path === '/overview'
        ? location.pathname === '/overview' || location.pathname === '/'
        : item.path !== '/'
          ? location.pathname.startsWith(item.path) ||
            (item.path === '/contacts' &&
              location.pathname.startsWith('/objects/contacts')) ||
            (item.path === '/pipeline' &&
              location.pathname.startsWith('/objects/contacts?viewId='))
          : location.pathname === '/';
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
    <>
      <Section>
        <Label>Espace</Label>
        {items.map(renderItem)}
      </Section>
      <Section>
        <Label>Compte</Label>
        {accountItems.map(renderItem)}
      </Section>
    </>
  );
};
